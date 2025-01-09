import { useState, useEffect, useMemo } from "react";

const useSidebarMenu = ({ userRole }) => {
  const baseMenuItems = [
    { key: "home", label: "Home", path: "/" },
    { key: "bible", label: "Bible", path: "/bible" },
    { key: "notes", label: "Study Notes", path: "/notes" },
    { key: "bookmarks", label: "Bookmarks", path: "/bookmarks" },
    { key: "settings", label: "Settings", path: "/settings" },
  ];

  if (userRole === "admin") {
    baseMenuItems.push({
      key: "admin",
      label: "Admin",
      subItems: [
        { key: "dashboard", label: "Dashboard", path: "/admin/dashboard" },
        { key: "users", label: "Manage Users", path: "/admin/users" },
      ],
    });
  }

  // Restore activeMenu from localStorage
  const [activeMenu, setActiveMenu] = useState(() =>
      localStorage.getItem("activeMenu")
  );

  // Toggle submenu
  const toggleSubMenu = (menuKey) => {
    const newActiveMenu = activeMenu === menuKey ? null : menuKey;
    setActiveMenu(newActiveMenu);
    localStorage.setItem("activeMenu", newActiveMenu);
  };

  // Filter hidden menus (if implemented)
  const [hiddenMenus, setHiddenMenus] = useState(() => {
    const storedHidden = localStorage.getItem("hiddenMenus");
    return storedHidden ? JSON.parse(storedHidden) : new Set();
  });

  const toggleMenuVisibility = (menuKey) => {
    setHiddenMenus((prevHidden) => {
      const updated = new Set(prevHidden);
      if (updated.has(menuKey)) updated.delete(menuKey);
      else updated.add(menuKey);
      localStorage.setItem("hiddenMenus", JSON.stringify([...updated]));
      return updated;
    });
  };

  const menuItems = useMemo(
      () =>
          baseMenuItems.filter((menu) => !hiddenMenus.has(menu.key)),
      [baseMenuItems, hiddenMenus]
  );

  return {
    menuItems,
    activeMenu,
    toggleSubMenu,
    toggleMenuVisibility,
  };
};

export default useSidebarMenu;
