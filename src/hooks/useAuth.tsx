import {
    useState,
    useEffect,
    createContext,
    useContext
} from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
    User,
    AuthError,
    Session
} from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

// More robust type definitions
interface AuthUser extends User {
    username?: string;
    display_name?: string;
    avatar_url?: string;
}

interface AuthState {
    user: AuthUser | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
}

interface AuthContextType extends AuthState {
    signUp: (email: string, password: string, username: string) => Promise<{
        success: boolean;
        error?: string
    }>;
    signIn: (identifier: string, password: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<boolean>;
    updateProfile: (data: Partial<AuthUser>) => Promise<boolean>;
}

// Create context with initial undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
        error: null,
    });

    const navigate = useNavigate();

    // Centralized state update method
    const updateAuthState = (updates: Partial<AuthState>) => {
        setState(prevState => ({
            ...prevState,
            ...updates,
            loading: false
        }));
    };

    // Initialize and track authentication state
    useEffect(() => {
        // Fetch initial session
        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                await fetchUserProfile(session.user);
            } else {
                updateAuthState({
                    user: null,
                    session: null,
                    error: null
                });
            }
        };

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    await fetchUserProfile(session.user);
                } else if (event === 'SIGNED_OUT') {
                    updateAuthState({
                        user: null,
                        session: null,
                        error: null
                    });
                }
            }
        );

        initializeAuth();

        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Fetch and update user profile
    async function fetchUserProfile(authUser: User) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('username, display_name, avatar_url')
                .eq('id', authUser.id)
                .single();

            if (error) throw error;

            updateAuthState({
                user: {
                    ...authUser,
                    ...data
                },
                session: await supabase.auth.getSession().then(res => res.data.session),
                error: null
            });
        } catch (error) {
            updateAuthState({
                user: null,
                session: null,
                error: error instanceof Error ? error.message : 'Profile fetch failed'
            });
        }
    }

    // Sign Up Method
    const signUp = async (
        email: string,
        password: string,
        username: string
    ) => {
        try {
            // Check username uniqueness
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

            // Create auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('No user created');

            // Insert user profile
            const { error: profileError } = await supabase.from('users').insert({
                id: authData.user.id,
                username,
                email,
                created_at: new Date().toISOString(),
            });

            if (profileError) throw profileError;

            toast.success('Account created successfully');
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Signup failed';

            toast.error(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        }
    };

    // Sign In Method
    const signIn = async (identifier: string, password: string) => {
        try {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

            let emailToUse = identifier;

            // Handle username-based login
            if (!isEmail) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('email')
                    .eq('username', identifier)
                    .single();

                if (!userData) {
                    toast.error('Username not found');
                    return false;
                }

                emailToUse = userData.email;
            }

            // Authenticate
            const { error } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password
            });

            if (error) {
                toast.error(error.message);
                return false;
            }

            toast.success(`Welcome back, ${identifier}`);
            navigate('/bible');
            return true;
        } catch (error) {
            toast.error('Sign in failed');
            return false;
        }
    };

    // Sign Out Method
    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/');
            toast.success('Signed out successfully');
        } catch (error) {
            toast.error('Sign out failed');
        }
    };

    // Reset Password Method
    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;

            toast.success('Password reset email sent');
            return true;
        } catch (error) {
            toast.error('Password reset failed');
            return false;
        }
    };

    // Update Profile Method
    const updateProfile = async (data: Partial<AuthUser>) => {
        try {
            if (!state.user?.id) {
                toast.error('No user logged in');
                return false;
            }

            const { error } = await supabase
                .from('users')
                .update(data)
                .eq('id', state.user.id);

            if (error) throw error;

            await fetchUserProfile(state.user);
            toast.success('Profile updated successfully');
            return true;
        } catch (error) {
            toast.error('Profile update failed');
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{
            ...state,
            signUp,
            signIn,
            signOut,
            resetPassword,
            updateProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook for using auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};