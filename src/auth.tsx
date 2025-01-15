import React, { useEffect } from "react";
import { User } from "./generated/api/plantsSchemas";
import {
  fetchLogoutAuthLogoutPost,
  fetchReadUsersMeAuthMeGet,
  ReadUsersMeAuthMeGetError,
} from "./generated/api/plantsComponents";
import { useNavigate } from "react-router-dom";
import { ErrorWrapper } from "./generated/api/plantsFetcher";
import { useToast } from "./toast";

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
  const toast = useToast();
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
    const isLoginPath = window.location.pathname === "/login";
    if (error && error.status === 401 && !isLoginPath) {
      localStorage.setItem("currentPath", window.location.pathname);
      toast({
        message: "You have been logged out. Please log in again.",
        type: "warning",
        duration: 5000,
      });
      navigate("/login");
    }
  }, [error]);

  const reload = () => {
    setReloadCounter((prev) => prev + 1);
  };

  const logout = async () => {
    // clear the cookie
    try {
      await fetchLogoutAuthLogoutPost({});
    } catch (error) {
      console.error("Error logging out", error);
    }
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

export const useAuthErrorRedirect = (
  error: ErrorWrapper<{
    status: number;
    payload: unknown;
  }> | null
) => {
  const authContext = React.useContext(AuthContext);
  const toast = useToast();

  useEffect(() => {
    if (error && error.status === 401) {
      localStorage.setItem("currentPath", window.location.pathname);
      toast({
        message: "You have been logged out. Please log in again.",
        type: "warning",
        duration: 5000,
      });
      authContext.logout();
    } else if (error) {
      toast({
        message: "An error occurred. Please try again later.",
        type: "danger",
        duration: 5000,
      });
    }
  }, [error, authContext]);
};
