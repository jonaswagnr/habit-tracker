import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  // Optional: Wenn du bestimmte Schriftstärken verwenden möchtest
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: 'Habit Tracker',
  description: 'Track your daily habits',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={jakarta.className}>{children}</body>
    </html>
  )
}