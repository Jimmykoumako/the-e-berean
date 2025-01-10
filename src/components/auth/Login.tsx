import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {useAuth} from "@/hooks/useAuth";

// Validation schema using zod
const loginSchema = z.object({
    identifier: z.string().min(1, "Username or email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login = () => {
    const { signIn, user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the return URL from location state, or default to '/bible'
    const from = (location.state as { from?: Location })?.from?.pathname || '/bible';

    // Initialize the form with react-hook-form and zod validation
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identifier: "",
            password: "",
        },
    });

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate(from, { replace: true });
        }
    }, [user, navigate, from]);

    const onSubmit = async (values: LoginFormValues) => {
        try {
            const success = await signIn(values.identifier, values.password);

            if (success) {
                // The navigation will happen automatically due to the useEffect above
                // when the user state updates
                console.log('Login successful');
            } else {
                // Form error handling
                form.setError('root', {
                    type: 'manual',
                    message: 'Invalid credentials'
                });
            }
        } catch (error) {
            console.error("Login failed", error);
            form.setError('root', {
                type: 'manual',
                message: 'An error occurred during sign in'
            });
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md shadow-md">
                <CardHeader>
                    <CardTitle className="text-center">Welcome Back</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Username or Email Field */}
                            <FormField
                                name="identifier"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username or Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter your username or email"
                                                {...field}
                                                disabled={authLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Password Field */}
                            <FormField
                                name="password"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="Enter your password"
                                                {...field}
                                                disabled={authLoading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Form-level error message */}
                            {form.formState.errors.root && (
                                <div className="text-sm text-red-500 text-center">
                                    {form.formState.errors.root.message}
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={authLoading}
                            >
                                {authLoading ? (
                                    <span className="flex items-center justify-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing In...
                                    </span>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>

                            {/* Other Actions */}
                            <div className="flex justify-between">
                                <Button
                                    variant="link"
                                    type="button"
                                    onClick={() => navigate('/reset-password')}
                                    disabled={authLoading}
                                >
                                    Forgot password?
                                </Button>
                                <Button
                                    variant="link"
                                    type="button"
                                    onClick={() => navigate('/register')}
                                    disabled={authLoading}
                                >
                                    Sign Up
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};