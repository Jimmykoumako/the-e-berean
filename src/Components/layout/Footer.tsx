import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"

export const Footer = () => {
    return (
        <footer className="border-t">
            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="font-semibold mb-3">Bible Study App</h3>
                        <p className="text-sm text-muted-foreground">
                            Deepen your understanding of scripture
                        </p>
                    </div>

                    <div>
                        <h4 className="font-medium mb-3">Quick Links</h4>
                        <div className="space-y-2">
                            <Button variant="link" className="p-0 h-auto">About</Button>
                            <Button variant="link" className="p-0 h-auto">Privacy</Button>
                            <Button variant="link" className="p-0 h-auto">Terms</Button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-3">Resources</h4>
                        <div className="space-y-2">
                            <Button variant="link" className="p-0 h-auto">Study Guides</Button>
                            <Button variant="link" className="p-0 h-auto">Daily Verses</Button>
                            <Button variant="link" className="p-0 h-auto">Community</Button>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-3">Connect</h4>
                        <div className="flex space-x-4">
                            <Button variant="ghost" size="icon">
                                <Icons.twitter className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Icons.facebook className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Icons.instagram className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <Separator className="my-6" />

                <div className="text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Bible Study App. All rights reserved.
                </div>
            </div>
        </footer>
    );
};