import { Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { getSerwist } from "virtual:serwist";

import { AuthProvider } from "./auth";
import { ToastProvider } from "./toast";
import PlantsPage from "./pages/plants";
import LocationsPage from "./pages/locations";
import { ImagePreviewProvider } from "./components/image-preview";
import { PageLoadingProvider } from "./components/page-loading";
import PlantPage from "./pages/plant";
import WateringsPage from "./pages/waterings";
import ChecksPage from "./pages/checks";
import RemindersPage from "./pages/reminders";

import { LoginPage } from "@/pages/login";
import IndexPage from "@/pages/index";

const queryClient = new QueryClient({});

function App() {
  useEffect(() => {
    const loadSerwist = async () => {
      if ("serviceWorker" in navigator) {
        const serwist = await getSerwist();

        // serwist?.addEventListener("installed", () => {
        //   console.log("Serwist installed!");
        // });

        await serwist?.register();
      }
    };

    loadSerwist();
  }, []);

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
                <Route
                  element={<WateringsPage />}
                  path="/plants/:plantId/waterings"
                />
                <Route
                  element={<ChecksPage />}
                  path="/plants/:plantId/checks"
                />
                <Route
                  element={<RemindersPage />}
                  path="/plants/:plantId/reminders"
                />
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
