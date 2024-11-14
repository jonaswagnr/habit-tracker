import Link from 'next/link';
import { ProfileMenu } from '@/components/profile-menu';

export default function PreferencesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-[72px] border-b">
        <div className="max-w-[1920px] mx-auto px-6 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center gap-2">
              <Link href="/habits" className="flex items-center gap-2">
                <img src="/logo.svg" alt="nugs logo" className="h-8 w-8" />
                <h1 className="text-2xl font-bold">nugs</h1>
              </Link>
            </div>

            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1920px] mx-auto w-full px-6 py-6">
        {children}
      </main>
    </div>
  );
} 