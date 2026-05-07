"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./main-navigation.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: "home" | "studio" | "gallery" | "pricing" | "account" | "signup" | "support";
};

const getIcon = (iconName: NavItem["icon"]) => {
  const iconProps = {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (iconName) {
    case "home":
      return (
        <svg {...iconProps}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      );
    case "studio":
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      );
    case "gallery":
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      );
    case "pricing":
      return (
        <svg {...iconProps}>
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      );
    case "support":
      return (
        <svg {...iconProps}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      );
    case "account":
      return (
        <svg {...iconProps}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      );
    case "signup":
      return (
        <svg {...iconProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
          <line x1="17" y1="11" x2="23" y2="11"></line>
          <line x1="20" y1="8" x2="20" y2="14"></line>
        </svg>
      );
  }
};

type MainNavigationProps = {
  currentUser?: boolean;
  isAdmin?: boolean;
};

export function MainNavigation({ currentUser = false, isAdmin = false }: MainNavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const publicNav: NavItem[] = [
    { href: "/", label: "Accueil", icon: "home" },
    { href: "/generate", label: "Créer", icon: "studio" },
    { href: "/flyers", label: "Galerie", icon: "gallery" },
    { href: "/pricing", label: "Tarifs", icon: "pricing" },
  ];

  const authNav: NavItem[] = currentUser
    ? [
        { href: "/", label: "Accueil", icon: "home" },
        { href: "/generate", label: "Créer", icon: "studio" },
        { href: "/flyers", label: "Galerie", icon: "gallery" },
        { href: "/pricing", label: "Tarifs", icon: "pricing" },
        ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: "account" as const }] : []),
        { href: "/dashboard", label: "Projets", icon: "account" },
      ]
    : [
        ...publicNav,
        { href: "/signup", label: "Inscription", icon: "signup" },
      ];

  const navItems = currentUser ? authNav : publicNav;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        className={`${styles.burger} ${isOpen ? styles.burgerOpen : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Menu"
        aria-expanded={isOpen}
        aria-controls="main-navigation-mobile-menu"
      >
        <span />
        <span />
        <span />
      </button>

      <div id="main-navigation-mobile-menu" className={`${styles.mobileMenu} ${isOpen ? styles.open : ""}`}>
        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
        <nav className={styles.mobileNav}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={isActive(item.href) ? styles.active : ""}>
              <span className={styles.mobileIcon}>{getIcon(item.icon)}</span>
              {item.label}
            </Link>
          ))}
          <Link
            href={currentUser ? "/dashboard" : "/login"}
            onClick={() => setIsOpen(false)}
            className={styles.mobileSecondaryAction}
          >
            {currentUser ? "Mon espace" : "Se connecter"}
          </Link>
        </nav>
      </div>

      <nav className={styles.desktopNav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ""}`}
          >
            <span className={styles.icon}>{getIcon(item.icon)}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
