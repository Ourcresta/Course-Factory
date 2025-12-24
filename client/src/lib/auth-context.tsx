import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; token?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  verifySignup: (email: string, otp: string) => Promise<{ success: boolean; message: string; token?: string }>;
  logout: () => void;
  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'guru_auth_token';
const USER_KEY = 'guru_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      verifyStoredToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function verifyStoredToken(storedToken: string) {
    try {
      const response = await fetch('/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          clearAuth();
        }
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  function setAuthData(authToken: string, authUser: User) {
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
  }

  async function login(email: string, password: string): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (data.success && data.token) {
        setAuthData(data.token, data.user);
        return { success: true, message: data.message, token: data.token };
      }
      
      return { success: false, message: data.message || data.error || 'Login failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    }
  }

  async function signup(username: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/admin/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      
      if (data.success) {
        setPendingEmail(email);
        return { success: true, message: data.message };
      }
      
      return { success: false, message: data.message || data.error || 'Signup failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Signup failed' };
    }
  }

  async function verifySignup(email: string, otp: string): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      const response = await fetch('/api/admin/auth/verify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      
      if (data.success && data.token) {
        setAuthData(data.token, data.user);
        setPendingEmail(null);
        return { success: true, message: data.message, token: data.token };
      }
      
      return { success: false, message: data.message || data.error || 'Verification failed' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Verification failed' };
    }
  }

  function logout() {
    clearAuth();
    setPendingEmail(null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      signup,
      verifySignup,
      logout,
      pendingEmail,
      setPendingEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
