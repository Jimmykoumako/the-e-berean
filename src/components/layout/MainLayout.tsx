// components/layout/MainLayout.tsx
import { Header } from './Header'
import { Footer } from './Footer'
import { Sidebar } from './Sidebar'
import {useAuth} from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import {Outlet} from "react-router-dom";

interface MainLayoutProps {
    children: React.ReactNode
    requireAuth?: boolean
}

export const MainLayout = ({ children, requireAuth = false }: MainLayoutProps) => {
    const { user, loading } = useAuth()
    console.log("Auth State:", { user, loading });
    const userRole = user?.role || 'user';
    // Handle loading state
    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    // Handle authentication requirement
    if (requireAuth && !user) {
        window.location.href = '/login'
        return null
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex h-screen">
                <Sidebar userRole={userRole}/>
                <div className="flex-1 overflow-y-auto p-4">
                    {children}
                    <Outlet/>
                </div>
            </div>
            <Footer/>
        </div>
    )
}
