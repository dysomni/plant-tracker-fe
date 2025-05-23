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
      </footer>
    </div>
  );
}
