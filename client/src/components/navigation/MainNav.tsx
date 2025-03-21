import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Map, Book, Users, ShoppingCart, User } from "lucide-react";
import { motion } from "framer-motion";
import { navItemHoverVariants } from "@/lib/animations";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Map, label: "Journey", href: "/roadmap" },
  { icon: Users, label: "Network", href: "/network" },
  { icon: ShoppingCart, label: "Market", href: "/market" },
  { icon: User, label: "Profile/Inventory", href: "/profile" },
];

interface MainNavProps {
  orientation?: "horizontal" | "vertical";
  onNavClick?: () => void;
}

export default function MainNav({ orientation = "horizontal", onNavClick }: MainNavProps) {
  const [location] = useLocation();

  return (
    <nav className={cn(
      orientation === "horizontal" 
        ? "flex items-center space-x-4 lg:space-x-6 mx-6"
        : "flex flex-col space-y-4"
    )}>
      {navItems.map(({ icon: Icon, label, href }) => {
        const isActive = location === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavClick}
          >
            <motion.span
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary cursor-pointer",
                orientation === "vertical" && "w-full block py-2",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              variants={navItemHoverVariants}
              initial="initial"
              whileHover="hover"
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </span>
            </motion.span>
          </Link>
        );
      })}
    </nav>
  );
}