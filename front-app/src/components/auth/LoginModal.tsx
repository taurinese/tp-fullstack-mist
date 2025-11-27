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
}

export function LoginModal({ trigger, open, onOpenChange }: LoginModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Handle controlled vs uncontrolled state
  const show = open !== undefined ? open : isOpen;
  const setShow = onOpenChange || setIsOpen;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    login(username);
    setShow(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setUsername("");
    setPassword("");
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
              placeholder="Any name"
              autoFocus
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
              placeholder="Any password"
            />
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
             <Button type="submit">{isSignUp ? "Sign Up" : "Login"}</Button>
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
