import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LoginModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultMode?: 'login' | 'signup';
}

export function LoginModal({ trigger, open, onOpenChange, defaultMode = 'login' }: LoginModalProps) {
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Handle controlled vs uncontrolled state
  const show = open !== undefined ? open : isOpen;
  const setShow = (open: boolean) => {
     if (onOpenChange) onOpenChange(open);
     else setIsOpen(open);
     
     // Reset to default mode when closing or opening
     if (!open) {
        setTimeout(() => setIsSignUp(defaultMode === 'signup'), 200); // Delay reset for animation
     } else {
        setIsSignUp(defaultMode === 'signup');
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!username || !email || !password) {
          throw new Error("All fields are required");
        }
        await register(username, email, password);
      } else {
        if (!email || !password) {
          throw new Error("All fields are required");
        }
        await login(email, password);
      }
      setShow(false);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setUsername("");
    setEmail("");
    setPassword("");
    setError(null);
  };

  return (
    <Dialog open={show} onOpenChange={setShow}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Create Account" : "Sign In"}</DialogTitle>
          <DialogDescription>
            {isSignUp 
              ? "Enter your details to create a new account." 
              : "Enter your credentials to access your account."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          
          {isSignUp && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-3"
                placeholder="Your username"
                autoFocus
              />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="name@example.com"
              autoFocus={!isSignUp}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <DialogFooter className="flex-col sm:flex-col gap-2">
             <Button type="submit" disabled={isLoading}>
               {isLoading ? "Loading..." : (isSignUp ? "Sign Up" : "Login")}
             </Button>
             <div className="text-center text-sm text-muted-foreground mt-2">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button 
                  type="button" 
                  onClick={toggleMode}
                  className="underline hover:text-primary"
                >
                  {isSignUp ? "Login" : "Sign Up"}
                </button>
             </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}