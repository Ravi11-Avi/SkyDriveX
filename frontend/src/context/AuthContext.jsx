import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, setAccessToken, setRefreshToken, getAccessToken } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getAccessToken());
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("skydrivex_theme") || "dark");

  // Sync theme attribute and class with document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("skydrivex_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Check current session on mount
  useEffect(() => {
    const initAuth = async () => {
      const currentToken = getAccessToken();
      if (!currentToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          setAccessToken(null);
          setRefreshToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn("Initial authentication check failed:", err.message);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth expiration events dispatched by API client
    const handleAuthExpired = () => {
      setUser(null);
      setTokenState(null);
    };

    window.addEventListener("skydrivex:auth_expired", handleAuthExpired);
    return () => window.removeEventListener("skydrivex:auth_expired", handleAuthExpired);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success) {
      setAccessToken(res.accessToken);
      if (res.refreshToken) setRefreshToken(res.refreshToken);
      setTokenState(res.accessToken);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || "Login failed");
  };

  const register = async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    if (res.success) {
      setAccessToken(res.accessToken);
      if (res.refreshToken) setRefreshToken(res.refreshToken);
      setTokenState(res.accessToken);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || "Registration failed");
  };

  const loginWithToken = async (newToken) => {
    setAccessToken(newToken);
    setTokenState(newToken);
    const res = await authApi.getMe();
    if (res.success && res.user) {
      setUser(res.user);
      return res.user;
    }
    throw new Error("Failed to load user profile");
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors during logout
    } finally {
      setAccessToken(null);
      setRefreshToken(null);
      setTokenState(null);
      setUser(null);
    }
  };

  const updateProfile = async (data) => {
    const res = await authApi.updateProfile(data);
    if (res.success && res.user) {
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || "Failed to update profile");
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await authApi.changePassword({ currentPassword, newPassword });
    if (res.success) {
      if (res.accessToken) {
        setAccessToken(res.accessToken);
        setTokenState(res.accessToken);
      }
      if (res.user) setUser(res.user);
      return res;
    }
    throw new Error(res.message || "Failed to change password");
  };

  const deleteAccount = async () => {
    await authApi.deleteAccount();
    setAccessToken(null);
    setRefreshToken(null);
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        loading,
        theme,
        toggleTheme,
        login,
        register,
        loginWithToken,
        logout,
        updateProfile,
        updateUser: updateProfile,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
