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
    resetPassword: (email: string) => Promise<boolean>;
    updatePreferences: (preferences: UserPreferences) => (Promise<Awaited<boolean>>);
    updateProfile: (data: Partial<User>) => (Promise<never>);
    session: Session | null;
    updateReadingProgress: (progress: ReadingProgress) => (Promise<Awaited<boolean>>);
    signOut: () => any;
    loading: boolean;
    error: string | null;
    signUp: (email: string, password: string, username: string) => any;
    refreshSession: () => void;
    signIn: (identifier: string, password: string) => any;
    initialized: boolean;
    user: User | null
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

    const fetchUserProfile = useCallback((userId: string) => {
        return supabase
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
            .then(({ data, error }) => {
                if (error) throw error

                updateAuthState({
                    user: {
                        ...state.user,
                        ...data
                    } as AuthUser
                })
                return data
            })
            .catch(error => {
                console.error('Error fetching user profile:', error)
                updateAuthState({
                    error: 'Failed to fetch user profile'
                })
                throw error
            })
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

    const refreshSession = useCallback(() => {
        supabase.auth.refreshSession()
            .then(({ data: { session }, error }) => {
                if (error) throw error

                if (session) {
                    return fetchUserProfile(session.user.id)
                        .then(() => {
                            updateAuthState({
                                user: session.user as AuthUser,
                                session
                            })
                            setupSessionRefreshTimer(session)
                        })
                } else {
                    updateAuthState({
                        user: null,
                        session: null,
                        error: 'No valid session'
                    })
                    navigate('/login')
                }
            })
            .catch(error => {
                console.error('Session refresh failed:', error)
                updateAuthState({
                    user: null,
                    session: null,
                    error: 'Session expired'
                })
                navigate('/login')
            })
    }, [fetchUserProfile, navigate, setupSessionRefreshTimer, updateAuthState])

    const signUp = (email: string, password: string, username: string) => {
        return supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single()
            .then(({ data: existingUser }) => {
                if (existingUser) {
                    return { success: false, error: 'Username already exists' }
                }

                return supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username }
                    }
                })
            })
            .then(({ data: authData, error: authError }) => {
                if (authError) throw authError
                if (!authData?.user) throw new Error('No user created')

                return supabase.from('users').insert({
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
            })
            .then(() => {
                toast({
                    title: "Success!",
                    description: "Your account has been created."
                })
                return { success: true }
            })
            .catch(error => {
                const errorMessage = error instanceof Error ? error.message : 'Signup failed'
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive"
                })
                return { success: false, error: errorMessage }
            })
    }

    const signIn = (identifier: string, password: string) => {
        updateAuthState({ loading: true })
        const isEmail = identifier.includes('@')

        let signInPromise
        if (isEmail) {
            signInPromise = Promise.resolve({ email: identifier })
        } else {
            signInPromise = supabase
                .from('users')
                .select('email')
                .eq('username', identifier)
                .single()
                .then(({ data: userData, error: userError }) => {
                    if (userError || !userData) {
                        toast({
                            title: "Error",
                            description: "Username not found",
                            variant: "destructive"
                        })
                        throw new Error('Username not found')
                    }
                    return userData
                })
        }

        return signInPromise
            .then(({ email }) => {
                return supabase.auth.signInWithPassword({
                    email,
                    password
                })
            })
            .then(({ data, error }) => {
                if (error) throw error

                if (data.session) {
                    setupSessionRefreshTimer(data.session)
                }

                return supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single()
                    .then(({ data: userProfile }) => ({ data, userProfile }))
            })
            .then(({ data, userProfile }) => {
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
            })
            .catch(error => {
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Sign in failed",
                    variant: "destructive"
                })
                return false
            })
    }

    // Other methods follow the same pattern...
    // I'll show one more example for updateProfile:

    const updateProfile = (data: Partial<AuthUser>) => {
        if (!state.user?.id) {
            return Promise.reject(new Error('No user logged in'))
        }

        let updateChain = Promise.resolve()

        if (data.email) {
            updateChain = updateChain
                .then(() => supabase.auth.updateUser({
                    email: data.email
                }))
                .then(({ error: emailError }) => {
                    if (emailError) throw emailError
                })
        }

        return updateChain
            .then(() => supabase
                .from('users')
                .update({
                    username: data.username,
                    display_name: data.display_name,
                    avatar_url: data.avatar_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', state.user.id)
            )
            .then(({ error: profileError }) => {
                if (profileError) throw profileError
                return fetchUserProfile(state.user!.id)
            })
            .then(() => {
                toast({
                    title: "Profile updated",
                    description: "Your profile has been updated successfully"
                })
                return true
            })
            .catch(error => {
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to update profile",
                    variant: "destructive"
                })
                return false
            })
    }

    const signOut = () => {
        return supabase.auth.signOut()
            .then(({ error }) => {
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
            })
            .catch(error => {
                toast({
                    title: "Error",
                    description: "Failed to sign out",
                    variant: "destructive"
                })
            })
    }

    const resetPassword = (email: string) => {
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        })
            .then(({ error }) => {
                if (error) throw error

                toast({
                    title: "Password reset email sent",
                    description: "Check your email for the reset link"
                })

                return true
            })
            .catch(error => {
                toast({
                    title: "Error",
                    description: "Failed to send reset email",
                    variant: "destructive"
                })
                return false
            })
    }

    const updateReadingProgress = (progress: ReadingProgress) => {
        if (!state.user?.id) return Promise.resolve(false)

        return supabase
            .from('users')
            .update({
                reading_progress: progress
            })
            .eq('id', state.user.id)
            .then(({ error }) => {
                if (error) throw error

                updateAuthState({
                    user: {
                        ...state.user,
                        reading_progress: progress
                    }
                })

                return true
            })
            .catch(error => {
                toast({
                    title: "Error",
                    description: "Failed to update reading progress",
                    variant: "destructive"
                })
                return false
            })
    }

    const updatePreferences = (preferences: UserPreferences) => {
        if (!state.user?.id) return Promise.resolve(false)

        return supabase
            .from('users')
            .update({
                preferences
            })
            .eq('id', state.user.id)
            .then(({ error }) => {
                if (error) throw error

                updateAuthState({
                    user: {
                        ...state.user,
                        preferences
                    }
                })

                return true
            })
            .catch(error => {
                toast({
                    title: "Error",
                    description: "Failed to update preferences",
                    variant: "destructive"
                })
                return false
            })
    }

    // Use useCallback for all the functions we need in useEffect
    const handleSession = useCallback((session: Session | null) => {
        if (session) {
            fetchUserProfile(session.user.id)
                .then(() => {
                    updateAuthState({
                        user: session.user as AuthUser,
                        session
                    })
                    setupSessionRefreshTimer(session)
                })
        } else {
            updateAuthState({
                user: null,
                session: null
            })
        }
    }, []) // Empty dependency array since we can access other functions through closure

    // Initialize auth state
    useEffect(() => {
        let isSubscribed = true

        // Initial session check
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                if (!isSubscribed) return

                if (session) {
                    return fetchUserProfile(session.user.id)
                        .then(() => {
                            if (!isSubscribed) return
                            setupSessionRefreshTimer(session)
                            return session
                        })
                }
                return session
            })
            .then(session => {
                if (!isSubscribed) return
                updateAuthState({
                    session,
                    initialized: true
                })
            })

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!isSubscribed) return
                handleSession(session)
            }
        )

        // Cleanup
        return () => {
            isSubscribed = false
            subscription.unsubscribe()
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current)
            }
        }
    }, []) // Empty dependency array since we use closure to access functions

    const contextValue = {
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
        <AuthContext.Provider value={contextValue as AuthContextType}>
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