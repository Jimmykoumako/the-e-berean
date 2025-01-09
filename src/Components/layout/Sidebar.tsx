import {Card, CardContent} from "@/Components/ui/card";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList
} from "@/Components/ui/navigation-menu";
import {Button} from "@/Components/ui/button";
import {Menu} from "lucide-react";
import {Sheet, SheetContent, SheetTrigger} from "@/Components/ui/sheet";
import useSidebarMenu from "@/hooks/useSidebarMenu";

export const Sidebar = ({ userRole }) => {
    const { menuItems, activeMenu, toggleSubMenu } = useSidebarMenu({ userRole });

    return (
        <>
            {/* Desktop Sidebar */}
            <Card className="hidden md:block h-screen w-64 rounded-none border-r">
                <CardContent className="p-4">
                    <NavigationMenu orientation="vertical">
                        <NavigationMenuList className="flex-col space-y-2">
                            {menuItems.map((menu) => (
                                <div key={menu.key}>
                                    <NavigationMenuItem>
                                        {/* Parent Menu */}
                                        <div
                                            className={`flex items-center block p-2 hover:bg-accent rounded-md cursor-pointer ${
                                                activeMenu === menu.key ? "bg-accent" : ""
                                            }`}
                                            onClick={() => toggleSubMenu(menu.key)}
                                        >
                                            {menu.icon} {menu.label}
                                        </div>

                                        {/* Submenu with Animation */}
                                        {activeMenu === menu.key && menu.subItems && (
                                            <div
                                                className={`pl-4 overflow-hidden transition-all duration-300 ease-in-out ${
                                                    activeMenu === menu.key ? "max-h-screen" : "max-h-0"
                                                }`}
                                            >
                                                {menu.subItems.map((subItem) => (
                                                    <NavigationMenuLink
                                                        key={subItem.key}
                                                        href={subItem.path}
                                                        className="block p-2 hover:bg-muted rounded-md"
                                                    >
                                                        {subItem.label}
                                                    </NavigationMenuLink>
                                                ))}
                                            </div>
                                        )}
                                    </NavigationMenuItem>
                                </div>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </CardContent>
            </Card>

            {/* Mobile Sidebar */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                    <NavigationMenu orientation="vertical">
                        <NavigationMenuList className="flex-col space-y-2">
                            {menuItems.map((menu) => (
                                <div key={menu.key}>
                                    <NavigationMenuItem>
                                        <div
                                            className={`flex items-center block p-2 hover:bg-accent rounded-md cursor-pointer ${
                                                activeMenu === menu.key ? "bg-accent" : ""
                                            }`}
                                            onClick={() => toggleSubMenu(menu.key)}
                                        >
                                            {menu.icon} {menu.label}
                                        </div>

                                        {activeMenu === menu.key && menu.subItems && (
                                            <div
                                                className={`pl-4 overflow-hidden transition-all duration-300 ease-in-out ${
                                                    activeMenu === menu.key ? "max-h-screen" : "max-h-0"
                                                }`}
                                            >
                                                {menu.subItems.map((subItem) => (
                                                    <NavigationMenuLink
                                                        key={subItem.key}
                                                        href={subItem.path}
                                                        className="block p-2 hover:bg-muted rounded-md"
                                                    >
                                                        {subItem.label}
                                                    </NavigationMenuLink>
                                                ))}
                                            </div>
                                        )}
                                    </NavigationMenuItem>
                                </div>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </SheetContent>
            </Sheet>
        </>
    );
};
