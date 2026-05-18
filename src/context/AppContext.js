"use client";
/**
 * APP CONTEXT (React Context API)
 * ================================
 */

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { users as mockUsers } from "@/lib/data";
import { supabase } from "@/lib/supabase";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");
  const [notification, setNotification] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [theme, setTheme] = useState("light");

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }, []);

  // Initialize Supabase Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user);
      } else {
        setIsAuthLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user);
      } else {
        setCurrentUser(null);
        setIsAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      // Attempt to fetch from Supabase public.users
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (data) {
        // Map snake_case to camelCase
        setCurrentUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          department: data.department,
          managerId: data.manager_id
        });
      } else {
        // Fallback for hackathon demo if row doesn't exist yet
        setCurrentUser({
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || "Demo User",
          email: authUser.email,
          role: "employee", // Default role
          department: "Engineering",
          managerId: null
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      // Fallback
      setCurrentUser({
        id: authUser.id,
        name: authUser.email?.split('@')[0] || "Demo User",
        email: authUser.email,
        role: "employee",
        department: "Engineering",
      });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setActivePage("dashboard");
  };

  // For compatibility with any remaining mock components that need "switchUser"
  // Note: switchUser won't actually sign you in as that user in Supabase.
  // It's recommended to use signOut instead.
  const switchUser = useCallback((userId) => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setActivePage("dashboard");
    }
  }, []);

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  return (
    <AppContext.Provider value={{
      session,
      currentUser,
      currentUserId: currentUser?.id,
      signOut,
      switchUser, // kept for demo compatibility if needed
      activePage,
      setActivePage,
      notification,
      showNotification,
      allUsers: mockUsers,
      isAuthLoading,
      theme,
      toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
