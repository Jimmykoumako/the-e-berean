import  { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import {BrowserRouter as Router, Routes, Route, BrowserRouter, Navigate} from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import {AuthProvider} from "@/hooks/useAuth.tsx";
import {useAuth} from '@/hooks/useAuth'
import {MainLayout} from "@/Components/layout/MainLayout";
import {ResetPassword} from "@/Components/auth/PasswordReset";
import {Register} from "@/Components/auth/Register";
import {Login} from "@/Components/auth/Login";
import {Toaster} from "react-hot-toast";
import Home from "@/pages/Home.jsx";
import Bible from "@/pages/Bible.jsx";
import Notes from "@/pages/Notes.jsx";
import Bookmarks from "@/pages/Bookmarks.jsx";
import Settings from "@/pages/Settings.jsx";
import {Loader2} from "lucide-react";
import UserList from "@/Components/public/UserList.jsx";
import RootLayout from "@/Components/layout/RootLayout";
import BibleReadingTest from "@/Components/Bible/BibleReadingTest";
import BibleReader from "@/Components/Bible/BibleReader";
import {Providers} from "@/providers";
import {ProtectedRoute} from "@/Components/auth/ProtectedRoute";
import AuthLoading from "@/Components/auth/AuthLoading";


const ProtectedRoute2 = ({
                                   children,
                                   redirectPath = '/login',

}) => {
    const { user, loading, refreshSession } = useAuth();

    // Use in components that need fresh session data
    useEffect(() => {
        refreshSession();
    }, []);
    if (loading) {
        console.log("Auth State:", { user, loading });
                return (
            <div className="h-screen w-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }


    if (!user) {
        return <Navigate to={redirectPath} />;
    }

    return children;
};


const getUserRole = () => "user";

function App() {

    return (
        <BrowserRouter>
        <Providers>
          <AuthLoading>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/test" element={<BibleReader />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <Home />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/bible"
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <Bible />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/notes"
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <Notes />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/bookmarks"
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <Bookmarks />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <Settings />
                                </MainLayout>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
          </AuthLoading>
        </Providers>
        </BrowserRouter>

        // <div>
        //     <h1>Supabase Test</h1>
        //     {error ? <p>Error: {error}</p> : <pre>{JSON.stringify(data, null, 2)}</pre>}
        // </div>
        // <div>
        //     {/*<div className="p-8">*/}
        //     {/*    <h1 className="text-2xl font-bold mb-4">Bible Data Management</h1>*/}
        //     {/*    <LoadBibleData bibleVersionId={versionId} onComplete={handleComplete}/>*/}
        //
        //     {/*</div>*/}
        //     {/*<DownloadBibleFiles  onLoadFile={handleLoadFile} />*/}
        //     {/*<BibleDataUploader />*/}
        //     {/*<BibleNavigation />*/}
        //     <BibleSearchV1 />
        //     <QueryClientProvider client={queryClient}>
        //         {/*<Component {...pageProps} />*/}
        //     </QueryClientProvider>
        // </div>

    );
}

export default App;


