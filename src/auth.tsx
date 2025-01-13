import React, { useEffect } from "react";
import { User } from "./generated/api/plantsSchemas";
import {
  fetchLogoutAuthLogoutPost,
  fetchReadUsersMeAuthMeGet,
  ReadUsersMeAuthMeGetError,
  useReadUsersMeAuthMeGet,
} from "./generated/api/plantsComponents";
import { useNavigate } from "react-router-dom";

export interface AuthContextType {
  user: User | null;
  userLoading: boolean;
  logout: () => Promise<void>;
  reload: () => void;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  userLoading: true,
  logout: async () => {},
  reload: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [reloadCounter, setReloadCounter] = React.useState(0);
  const [fetchedUser, setFetchedUser] = React.useState<User | null>(null);
  const [userLoading, setUserLoading] = React.useState(true);
  const [error, setError] = React.useState<ReadUsersMeAuthMeGetError | null>(
    null
  );

  useEffect(() => {
    setUserLoading(true);
    fetchReadUsersMeAuthMeGet({})
      .then((user) => {
        setFetchedUser(user);
        setUserLoading(false);
      })
      .catch((error) => {
        setError(error);
        setUserLoading(false);
      });
  }, [reloadCounter]);

  useEffect(() => {
    console.log("error", error);
    if (error && error.status === 401) {
      localStorage.setItem("currentPath", window.location.pathname);
      navigate("/login");
    }
  }, [error, navigate]);

  const reload = () => {
    setReloadCounter((prev) => prev + 1);
  };

  const logout = async () => {
    // clear the cookie
    await fetchLogoutAuthLogoutPost({});
    setFetchedUser(null);
    setUserLoading(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user: fetchedUser ?? null,
        userLoading: userLoading,
        logout,
        reload,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
