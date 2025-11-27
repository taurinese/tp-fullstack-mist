import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type User = {
  id: number;
  name: string;
  email: string;
};

interface AuthContextType {
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage on mount
    const storedUser = localStorage.getItem('mist_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('mist_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (username: string) => {
    // Fake login logic
    // Always returns user ID 1 to match backend seed data
    const fakeUser: User = {
      id: 1,
      name: username,
      email: `${username.toLowerCase().replace(/\s/g, '')}@example.com`
    };
    
    setUser(fakeUser);
    localStorage.setItem('mist_user', JSON.stringify(fakeUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mist_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
