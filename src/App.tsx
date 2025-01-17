import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import { LoginPage } from "@/pages/login";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./auth";
import { ToastProvider } from "./toast";
import PlantsPage from "./pages/plants";
import LocationsPage from "./pages/locations";
import { ImagePreviewProvider } from "./components/image-preview";
import { PageLoadingProvider } from "./components/page-loading";
import PlantPage from "./pages/plant";

const queryClient = new QueryClient({});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <ImagePreviewProvider>
            <PageLoadingProvider>
              <Routes>
                <Route element={<IndexPage />} path="/" />
                <Route element={<LoginPage />} path="/login" />
                <Route element={<PlantsPage />} path="/plants" />
                <Route element={<PlantPage />} path="/plants/:plantId" />
                <Route element={<LocationsPage />} path="/locations" />
              </Routes>
            </PageLoadingProvider>
          </ImagePreviewProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
