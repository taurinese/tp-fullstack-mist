import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Gamepad2, Library, Store, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LoginModal } from "@/components/auth/LoginModal";

export function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="bg-primary text-primary-foreground p-1 rounded-sm">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">MIST</span>
          </Link>
          
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link 
              to="/store" 
              className={cn(
                "flex items-center gap-2 transition-colors hover:text-foreground",
                isActive("/store") ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Store className="h-4 w-4" />
              Store
            </Link>
            <Link 
              to="/library" 
              className={cn(
                "flex items-center gap-2 transition-colors hover:text-foreground",
                isActive("/library") ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Library className="h-4 w-4" />
              Library
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden md:inline-block">
                Welcome, {user.username}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
              >
                Logout
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LoginModal 
                trigger={
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                } 
              />
              <LoginModal 
                trigger={
                  <Button size="sm">
                    Sign up
                  </Button>
                }
                defaultMode="signup"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}