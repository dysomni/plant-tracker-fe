import { CircularProgress } from "@nextui-org/react";
import { createContext, useContext, useEffect, useState } from "react";

export type PageLoadingContextType = {
  setLoading: (loading: boolean) => void;
};

export const PageLoadingContext = createContext<
  PageLoadingContextType | undefined
>(undefined);

export const PageLoadingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState(false);

  return (
    <PageLoadingContext.Provider value={{ setLoading }}>
      {loading ? (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
          }}
        >
          <CircularProgress aria-label="Loading..." color="success" />
        </div>
      ) : null}
      {children}
    </PageLoadingContext.Provider>
  );
};

export const usePageLoading = (loading: boolean) => {
  const pageLoadingContext = useContext(PageLoadingContext);
  if (!pageLoadingContext) {
    throw new Error("usePageLoading must be used within a PageLoadingProvider");
  }
  const { setLoading } = pageLoadingContext;
  useEffect(() => {
    setLoading(loading);
  }, [loading]);
};
