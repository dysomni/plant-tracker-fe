import { Button } from "@nextui-org/react";

import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen items-center">
      <Navbar />
      <main className="max-w-screen-xl px-6 py-4 md:py-8 flex flex-col flex-grow items-center w-screen">
        {children}
      </main>
      <footer className="w-full flex gap-2 items-center justify-center py-3 bg-content2 dark:bg-content1 text-foreground-400 transition-colors duration-100">
        Website by Dysomni
        <Button
          size="sm"
          onPress={async () => {
            Notification.requestPermission().then(async (result) => {
              if (result === "granted") {
                // do more stuff if needed
              }
            });
          }}
        >
          Allow Notifications
        </Button>
        <Button
          size="sm"
          onPress={async () => {
            const options = {
              body: `You have 4 plants that need watering today.`,
              title: `Time to water your plants!`,
              icon: "/apple-touch-icon.png",
              actions: [
                {
                  action: "open",
                  title: "Open the app",
                },
              ],
            };

            const registration = await navigator.serviceWorker.ready;

            await registration?.showNotification("Plant Tracker", options);
          }}
        >
          Test Notification
        </Button>
      </footer>
    </div>
  );
}
