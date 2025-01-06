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
import {useToast} from "@/hooks/use-toast";

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
    refreshSession: () => Promise<void>;
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
    const [sessions, setSession] = useState(null)

    const navigate = useNavigate();
    // const { toast } = useToast();

    // Centralized state update method
    const updateAuthState = (updates: Partial<AuthState>) => {
        setState(prevState => ({
            ...prevState,
            ...updates,
            loading: false
        }));
    };

    // Improved session management
    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("session")
            console.log(session)

        })

        setTimeout(()=> {
            console.log("Waiting...")
            console.log(state)
        }, 10000)

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            switch (event) {
                case 'SIGNED_IN':
                    if (session) {
                        await fetchUserProfile(session.user.id);
                        setState(prev => ({
                            ...prev,
                            user: session.user as AuthUser,
                            session,
                            loading: false
                        }));
                    }
                    break;
                case 'SIGNED_OUT':
                    setState({
                        user: null,
                        session: null,
                        loading: false,
                        error: null
                    });
                    navigate('/');
                    break;
                case 'TOKEN_REFRESHED':
                    if (session) {
                        setState(prev => ({
                            ...prev,
                            session,
                            loading: false
                        }));
                    }
                    break;
                default:
                    if (session) {
                        setState(prev => ({
                            ...prev,
                            session,
                            loading: false
                        }));
                    }
                    break;
            }
        });

        // Cleanup subscription
        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    // Fetch and update user profile
    // Fetch user profile
    async function fetchUserProfile(userId: string) {
        const { data, error } = await supabase
            .from('users')
            .select('username, display_name, avatar_url')
            .eq('id', userId)
            .single();

        if (error) {
            setState(prev => ({
                ...prev,
                error,
                loading: false
            } as AuthState));
            return;
        }

        setState(prev => ({
            ...prev,
            user: {
                ...prev.user,
                ...data
            } as AuthUser,
            loading: false,
            error: null
        }));
    }

    // Refresh session manually
    const refreshSession = async () => {
        const { data: { session } } = await supabase.auth.refreshSession();

        if (session) {
            setState(prev => ({
                ...prev,
                session,
                user: session.user as AuthUser
            }));
        }
    };

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

            // toast.('Account created successfully');
            return { success: true, user: authData.user };
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Signup failed';

            // toast.error(errorMessage);
            console.error('Signup Error:', error);
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
            console.log("Is is an email:",isEmail)
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

            console.log("Attempt to sign in")
            // Attempt to sign in
            const { data, error } = await supabase.auth.signInWithPassword({
                email: emailToUse,
                password
            }).then(res=> console.log(res));

            console.log("After sign in: data", data)
            console.log("After sign in: error", error)

            if (error) {
                toast.error(error.message);
                return false;
            }

            // Verify user exists
            if (!data.user) {
                throw new Error('Authentication failed');
            }


            // Optional: Additional verification
            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                throw new Error('Could not retrieve user profile');
            }

            // // Success toast
            // toast({
            //     title: "Welcome back!",
            //     description: `Signed in as ${identifier}`,
            // });

            toast.success(`Welcome back, ${identifier}`);
            setState(prevState => ({ ...prevState, loading: false}))
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

    const contextValue: AuthContextType = {
        ...state,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        refreshSession
    };

    return (
        <AuthContext.Provider value={contextValue}>
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