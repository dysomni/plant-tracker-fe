import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import { LoginPage } from "@/pages/login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth";

const queryClient = new QueryClient({});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route element={<IndexPage />} path="/" />
          <Route element={<LoginPage />} path="/login" />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
