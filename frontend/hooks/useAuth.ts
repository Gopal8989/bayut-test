import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getUser, removeAuthToken, getAuthToken } from '../lib/auth';
import api from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = getAuthToken();
      const storedUser = getUser();

      if (token && storedUser) {
        // Verify token is still valid by making a test request
        try {
          // You can add a /auth/me endpoint to verify token
          setUser(storedUser);
          setIsAuthenticated(true);
        } catch (error) {
          // Token invalid, clear auth
          removeAuthToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      removeAuthToken();
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    logout,
    checkAuth,
  };
};

