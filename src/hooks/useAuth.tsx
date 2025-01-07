import {
    useState,
    useEffect,
    createContext,
    useContext
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    AuthError,
    Session
} from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast"
import {supabase} from "../../supabaseClient";

// Enhanced user interface for Bible study features
interface AuthUser extends User {
    username?: string;
    display_name?: string;
    avatar_url?: string;
    preferences?: {
        defaultBibleVersion?: string;
        fontSize?: number;
        theme?: 'light' | 'dark';
        notifications?: boolean;
    };
    reading_progress?: {
        lastRead?: {
            book: string;
            chapter: number;
            verse: number;
        };
        readingStreak?: number;
        completedPlans?: string[];
    };
}

interface AuthState {
    user: AuthUser | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
    initialized: boolean;
}

interface AuthContextType extends AuthState {
    signUp: (email: string, password: string, username: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    signIn: (identifier: string, password: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<boolean>;
    updateProfile: (data: Partial<AuthUser>) => Promise<boolean>;
    refreshSession: () => Promise<void>;
    updateReadingProgress: (progress: typeof AuthUser.reading_progress) => Promise<boolean>;
    updatePreferences: (preferences: typeof AuthUser.preferences) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: false,
        error: null,
        initialized: false
    });

    const navigate = useNavigate();
    const { toast } = useToast()
    // Enhanced state update method with type safety
    const updateAuthState = (updates: Partial<AuthState>) => {
        setState(prevState => ({
            ...prevState,
            ...updates,
            loading: false
        }));
    };

    useEffect(() => {
        let refreshTimer: NodeJS.Timeout;

        if (state.session?.expires_at) {
            const expiryTime = new Date(state.session.expires_at).getTime();
            const timeToExpiry = expiryTime - Date.now();
            const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry

            if (timeToExpiry > 0) {
                refreshTimer = setTimeout(() => {
                    refreshSession();
                }, timeToExpiry - refreshBuffer);
            }
        }

        return () => {
            if (refreshTimer) {
                clearTimeout(refreshTimer);
            }
        };
    }, [state.session?.expires_at]);

    useEffect(() => {
        refreshSession()
        // Initial session and persistence setup
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchUserProfile(session.user.id);
                // Set up session persistence
                supabase.auth.setSession({
                    access_token: session.access_token,
                    refresh_token: session.refresh_token
                });
            }
            setState(prev => ({
                ...prev,
                session,
                initialized: true,
                loading: false
            }));
        });

        // Enhanced auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                if (session) {
                    await fetchUserProfile(session.user.id);
                    updateAuthState({
                        user: session.user as AuthUser,
                        session,
                        loading: false
                    });
                }
            } else if (event === 'SIGNED_OUT') {
                updateAuthState({
                    user: null,
                    session: null,
                    error: null
                });
                navigate('/');
            } else {
                updateAuthState({
                    user: null,
                    session: null,
                    error: null
                });
                navigate('/');
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    // Enhanced user profile fetching with Bible study specific data
    async function fetchUserProfile(userId: string) {
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
            .single();

        if (error) {
            updateAuthState({ error: error.message });
            return;
        }

        updateAuthState({
            user: {
                ...state.user,
                ...data
            } as AuthUser,
            loading: false
        });
    }

    // Enhanced sign up with initial Bible study preferences
    const signUp = async (email: string, password: string, username: string) => {
        try {
            const { data: existingUser } = await supabase
                .from('users')
                .select('username')
                .eq('username', username)
                .single();

            if (existingUser) {
                return {
                    success: false,
                    error: 'Username already exists'
                };
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('No user created');

            // Initialize user profile with Bible study preferences
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
                },
                created_at: new Date().toISOString()
            });

            if (profileError) throw profileError;

            toast({
                title: "Success!",
                description: "Your account has been created."
            });

            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Signup failed';
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
            return { success: false, error: errorMessage };
        }
    };

    // Enhanced sign in with last read position recovery
    const signIn = async (identifier: string, password: string) => {
        try {
            const isEmail = identifier.includes('@');
            let emailToUse = identifier;

            if (!isEmail) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('email')
                    .eq('username', identifier)
                    .single();

                if (!userData) {
                    toast({
                        title: "Error",
                        description: "Username not found",
                        variant: "destructive"
                    });
                    return false;
                }
                emailToUse = userData.email;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password
            });

            if (error) throw error;

            const { data: userProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (userProfile?.reading_progress?.lastRead) {
                // Navigate to last read position
                navigate(`/bible/${userProfile.reading_progress.lastRead.book}/${userProfile.reading_progress.lastRead.chapter}`);
            } else {
                navigate('/bible');
            }

            toast({
                title: "Welcome back!",
                description: `Signed in as ${identifier}`
            });

            return true;
        } catch (error) {
            toast({
                title: "Error",
                description: "Sign in failed",
                variant: "destructive"
            });
            return false;
        }
    };

    // Additional Bible study specific methods
    const updateReadingProgress = async (progress: typeof AuthUser.reading_progress) => {
        try {
            if (!state.user?.id) return false;

            const { error } = await supabase
                .from('users')
                .update({
                    reading_progress: progress
                })
                .eq('id', state.user.id);

            if (error) throw error;
            return true;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update reading progress",
                variant: "destructive"
            });
            return false;
        }
    };

    const updatePreferences = async (preferences: typeof AuthUser.preferences) => {
        try {
            if (!state.user?.id) return false;

            const { error } = await supabase
                .from('users')
                .update({
                    preferences
                })
                .eq('id', state.user.id);

            if (error) throw error;
            return true;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update preferences",
                variant: "destructive"
            });
            return false;
        }
    };

    // Sign out method
    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            // Clear any local storage or state
            updateAuthState({
                user: null,
                session: null,
                error: null,
                loading: false
            });

            toast({
                title: "Signed out successfully",
                description: "You have been logged out."
            });

            navigate('/');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to sign out",
                variant: "destructive"
            });
        }
    };

    // Reset password method
    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });

            if (error) throw error;

            toast({
                title: "Password reset email sent",
                description: "Check your email for the reset link"
            });

            return true;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send reset email",
                variant: "destructive"
            });
            return false;
        }
    };

    // Update profile method
    const updateProfile = async (data: Partial<AuthUser>) => {
        try {
            if (!state.user?.id) {
                throw new Error('No user logged in');
            }

            // Update auth data if email is being changed
            if (data.email) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email: data.email
                });
                if (emailError) throw emailError;
            }

            // Update profile data in the users table
            const { error: profileError } = await supabase
                .from('users')
                .update({
                    username: data.username,
                    display_name: data.display_name,
                    avatar_url: data.avatar_url,
                    updated_at: new Date().toISOString()
                })
                .eq('id', state.user.id);

            if (profileError) throw profileError;

            // Refresh user data
            await fetchUserProfile(state.user.id);

            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully"
            });

            return true;
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update profile",
                variant: "destructive"
            });
            return false;
        }
    };

    // Refresh session method
    const refreshSession = async () => {
        try {
            // First try to get session from localStorage
            const { data: { session: storedSession } } = await supabase.auth.getSession();

            if (storedSession) {
                // If we have a stored session, try to refresh it
                const { data: { session }, error } = await supabase.auth.refreshSession({
                    refresh_token: storedSession.refresh_token
                });

                if (error) throw error;

                if (session) {
                    // Store the new tokens
                    await supabase.auth.setSession({
                        access_token: session.access_token,
                        refresh_token: session.refresh_token
                    });

                    await fetchUserProfile(session.user.id);
                    updateAuthState({
                        user: session.user as AuthUser,
                        session,
                        loading: false
                    });
                    return;
                }
            }

            // If we get here, no valid session exists
            updateAuthState({
                user: null,
                session: null,
                loading: false,
                error: 'No valid session'
            });
            navigate('/login');
        } catch (error) {
            console.error('Session refresh failed:', error);
            updateAuthState({
                user: null,
                session: null,
                loading: false,
                error: 'Session expired'
            });
            navigate('/login');
        }
    };
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
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};