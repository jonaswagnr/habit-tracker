import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'nugs',
  description: 'Track your habits',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-['Avenir_Next']">
        <div className="min-h-screen">
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  );
}