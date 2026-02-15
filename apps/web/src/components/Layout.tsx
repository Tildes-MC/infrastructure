import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Titlebar } from "@/components/Titlebar";

interface LayoutProps {
  children: ReactNode;
  showBack?: boolean;
}

export function Layout({ children, showBack }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Titlebar showBack={showBack} />
      <main className="flex-1 flex flex-col items-center p-4 pt-8 gap-4">
        {children}
      </main>
      <Footer />
    </div>
  );
}
