import React, { useEffect } from "react";
import { User } from "./generated/api/plantsSchemas";
import { useReadUsersMeAuthMeGet } from "./generated/api/plantsComponents";
import { useNavigate } from "react-router-dom";

export interface AuthContextType {
  user: User | null;
  userLoading: boolean;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  userLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useReadUsersMeAuthMeGet(
    {},
    { retry: false }
  );

  useEffect(() => {
    if (error) {
      localStorage.setItem("currentPath", window.location.pathname);
      navigate("/login");
    }
  }, [error, navigate]);

  return (
    <AuthContext.Provider
      value={{ user: data ?? null, userLoading: isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
