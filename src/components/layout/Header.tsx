import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {useAuth} from "@/hooks/useAuth";

export const Header = () => {
    const { user, signOut } = useAuth();

    return (
        <Card className="rounded-none border-b">
            <CardContent className="flex justify-between items-center p-4">
                <h1 className="text-xl font-bold">Bible Study App</h1>

                {user ? (
                    <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Button variant="ghost" onClick={signOut}>Sign Out</Button>
                    </div>
                ) : (
                    <Button variant="default" asChild>
                        <a href="/login">Login</a>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};
