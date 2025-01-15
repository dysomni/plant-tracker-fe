import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import { LoginPage } from "@/pages/login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth";
import { ToastProvider } from "./toast";
import PlantsPage from "./pages/plants";
import LocationsPage from "./pages/locations";

const queryClient = new QueryClient({});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<IndexPage />} path="/" />
            <Route element={<LoginPage />} path="/login" />
            <Route element={<PlantsPage />} path="/plants" />
            <Route element={<LocationsPage />} path="/locations" />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
