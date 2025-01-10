import React from 'react';
import {useAuth} from "@/hooks/useAuth";

interface AuthLoadingProps {
    children: React.ReactNode;
}

export const AuthLoading = ({ children }: AuthLoadingProps) => {
    const { initialized, loading } = useAuth();

    // Show loading spinner while auth is initializing or loading
    if (!initialized || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        );
    }

    // Once initialized and not loading, render children
    return <>{children}</>;
};

export default AuthLoading;