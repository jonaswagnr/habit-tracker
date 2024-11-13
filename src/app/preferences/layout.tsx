import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';

export default function PreferencesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Link href="/habits" className="flex items-center gap-2">
                <img src="/logo.svg" alt="nugs logo" className="h-8 w-8" />
                <h1 className="text-2xl font-bold">nugs</h1>
              </Link>
            </div>

            <Link href="/preferences">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {children}
      </main>
    </div>
  );
} 