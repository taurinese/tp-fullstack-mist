/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {type User, loginUser, registerUser, getCurrentUser, logoutUser } from './api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // On essaie de récupérer l'utilisateur courant.
        // Si le cookie est valide, ça marche. Sinon, ça lance une erreur.
        const user = await getCurrentUser();
        setUser(user);
      } catch {
        // Pas connecté ou session expirée
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Si loginUser lance une erreur, elle sera propagée
    const data = await loginUser(email, password);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    // Si registerUser ou login lance une erreur, elle sera propagée
    const newUser = await registerUser(username, email, password);
    // Le register connecte automatiquement côté serveur (set-cookie)
    // Mais l'API register renvoie l'user, donc on peut le setter directement
    setUser(newUser); 
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Exportation de useAuth séparée pour éviter le warning react-refresh
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
