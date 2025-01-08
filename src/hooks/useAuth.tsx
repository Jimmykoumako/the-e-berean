// src/contexts/auth/types.ts
import { User, Session } from '@supabase/supabase-js'

export interface UserPreferences {
    defaultBibleVersion?: string
    fontSize?: number
    theme?: 'light' | 'dark'
    notifications?: boolean
}

export interface ReadingProgress {
    lastRead?: {
        book: string
        chapter: number
        verse?: number
    }
    readingStreak?: number
    completedPlans?: string[]
}

export interface AuthUser extends User {
    username?: string
    display_name?: string
    avatar_url?: string
    preferences?: UserPreferences
    reading_progress?: ReadingProgress
}

export interface AuthState {
    user: AuthUser | null
    session: Session | null
    loading: boolean
    error: string | null
    initialized: boolean
}

export interface AuthContextType extends AuthState {
    signUp: (email: string, password: string, username: string) => Promise<{
        success: boolean
        error?: string
    }>
    signIn: (identifier: string, password: string) => Promise<boolean>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<boolean>
    updateProfile: (data: Partial<AuthUser>) => Promise<boolean>
    refreshSession: () => Promise<void>
    updateReadingProgress: (progress: ReadingProgress) => Promise<boolean>
    updatePreferences: (preferences: UserPreferences) => Promise<boolean>
}

// src/contexts/auth/AuthContext.tsx
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from "@/hooks/use-toast"
import {supabase, testSupabaseConnection} from "../../supabaseClient";
// import type { AuthContextType, AuthState, AuthUser, UserPreferences, ReadingProgress } from './types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
        error: null,
        initialized: false
    })

    const navigate = useNavigate()
    const { toast } = useToast()
    const refreshTimerRef = useRef<NodeJS.Timeout>()

    const updateAuthState = useCallback((updates: Partial<AuthState>) => {
        setState(prev => ({
            ...prev,
            ...updates,
            loading: false
        }))
    }, [])

    const fetchUserProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
                    username,
                    display_name,
                    avatar_url,
                    preferences,
                    reading_progress
                `)
                .eq('id', userId)
                .single()

            if (error) throw error

            updateAuthState({
                user: {
                    ...state.user,
                    ...data
                } as AuthUser
            })
        } catch (error) {
            console.error('Error fetching user profile:', error)
            updateAuthState({
                error: 'Failed to fetch user profile'
            })
        }
    }, [state.user, updateAuthState])

    const setupSessionRefreshTimer = useCallback((session: Session) => {
        // Clear any existing timer
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current)
        }

        if (session?.expires_at) {
            const expiryTime = new Date(session.expires_at).getTime()
            const timeToExpiry = expiryTime - Date.now()
            const refreshBuffer = 5 * 60 * 1000 // 5 minutes before expiry

            if (timeToExpiry > 0) {
                refreshTimerRef.current = setTimeout(() => {
                    refreshSession()
                }, timeToExpiry - refreshBuffer)
            }
        }
    }, [])

    const refreshSession = useCallback(async () => {
        try {
            const { data: { session }, error } = await supabase.auth.refreshSession()

            if (error) throw error

            if (session) {
                await fetchUserProfile(session.user.id)
                updateAuthState({
                    user: session.user as AuthUser,
                    session
                })
                setupSessionRefreshTimer(session)
            } else {
                updateAuthState({
                    user: null,
                    session: null,
                    error: 'No valid session'
                })
                navigate('/login')
            }
        } catch (error) {
            console.error('Session refresh failed:', error)
            updateAuthState({
                user: null,
                session: null,
                error: 'Session expired'
            })
            navigate('/login')
        }
    }, [fetchUserProfile, navigate, setupSessionRefreshTimer, updateAuthState])

    const signUp = async (email: string, password: string, username: string) => {
        try {
            const { data: existingUser } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single()

            if (existingUser) {
                return {
                    success: false,
                    error: 'Username already exists'
                }
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username }
                }
            })

            if (authError) throw authError
            if (!authData.user) throw new Error('No user created')

            const { error: profileError } = await supabase.from('users').insert({
                id: authData.user.id,
                username,
                email,
                preferences: {
                    defaultBibleVersion: 'KJV',
                    fontSize: 16,
                    theme: 'light',
                    notifications: true
                },
                reading_progress: {
                    readingStreak: 0,
                    completedPlans: []
                }
            })

            if (profileError) throw profileError

            toast({
                title: "Success!",
                description: "Your account has been created."
            })

            return { success: true }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Signup failed'
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            })
            return { success: false, error: errorMessage }
        }
    }

    const signIn = async (identifier: string, password: string) => {
        try {
            updateAuthState({ loading: true })
            const isEmail = identifier.includes('@')
            let emailToUse = identifier

            if (!isEmail) {
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('email')
                    .eq('username', identifier)
                    .single()

                if (userError || !userData) {
                    toast({
                        title: "Error",
                        description: "Username not found",
                        variant: "destructive"
                    })
                    return false
                }
                emailToUse = userData.email
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password
            })

            if (error) throw error

            if (data.session) {
                setupSessionRefreshTimer(data.session)
            }

            const { data: userProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single()

            updateAuthState({
                user: { ...data.user, ...userProfile } as AuthUser,
                session: data.session
            })

            if (userProfile?.reading_progress?.lastRead) {
                navigate(`/bible/${userProfile.reading_progress.lastRead.book}/${userProfile.reading_progress.lastRead.chapter}`)
            } else {
                navigate('/bible')
            }

            toast({
                title: "Welcome back!",
                description: `Signed in as ${identifier}`
            })

            return true
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Sign in failed",
                variant: "destructive"
            })
            return false
        }
    }

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error

            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current)
            }

            updateAuthState({
                user: null,
                session: null,
                error: null
            })

            toast({
                title: "Signed out successfully",
                description: "You have been logged out."
            })

            navigate('/login')
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to sign out",
                variant: "destructive"
            })
        }
    }

    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            })

            if (error) throw error

            toast({
                title: "Password reset email sent",
                description: "Check your email for the reset link"
            })

            return true
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send reset email",
                variant: "destructive"
            })
            return false
        }
    }

    const updateProfile = async (data: Partial<AuthUser>) => {
        try {
            if (!state.user?.id) {
                throw new Error('No user logged in')
            }

            if (data.email) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email: data.email
                })
                if (emailError) throw emailError
            }

            const { error: profileError } = await supabase
                .from('users')
                .update({
                    username: data.username,
                    display_name: data.display_name,
                    avatar_url: data.avatar_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', state.user.id)

            if (profileError) throw profileError

            await fetchUserProfile(state.user.id)

            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully"
            })

            return true
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update profile",
                variant: "destructive"
            })
            return false
        }
    }

    const updateReadingProgress = async (progress: ReadingProgress) => {
        try {
            if (!state.user?.id) return false

            const { error } = await supabase
                .from('users')
                .update({
                    reading_progress: progress
                })
                .eq('id', state.user.id)

            if (error) throw error

            updateAuthState({
                user: {
                    ...state.user,
                    reading_progress: progress
                }
            })

            return true
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update reading progress",
                variant: "destructive"
            })
            return false
        }
    }

    const updatePreferences = async (preferences: UserPreferences) => {
        try {
            if (!state.user?.id) return false

            const { error } = await supabase
                .from('users')
                .update({
                    preferences
                })
                .eq('id', state.user.id)

            if (error) throw error

            updateAuthState({
                user: {
                    ...state.user,
                    preferences
                }
            })

            return true
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update preferences",
                variant: "destructive"
            })
            return false
        }
    }

    useEffect(() => {
        // Initial session check
        console.log("Initial session check")
        testSupabaseConnection()
        console.log(supabase)
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("Session data", session)
            if (session) {
                fetchUserProfile(session.user.id)
                setupSessionRefreshTimer(session)
            }
            updateAuthState({
                session,
                initialized: true
            })
        })

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session) {
                    await fetchUserProfile(session.user.id)
                    updateAuthState({
                        user: session.user as AuthUser,
                        session
                    })
                    setupSessionRefreshTimer(session)
                } else {
                    updateAuthState({
                        user: null,
                        session: null
                    })
                }
            }
        )

        // Cleanup
        return () => {
            subscription.unsubscribe()
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current)
            }
        }
    }, [fetchUserProfile, setupSessionRefreshTimer, updateAuthState])

    const contextValue: AuthContextType = {
        ...state,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        refreshSession,
        updateReadingProgress,
        updatePreferences
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}