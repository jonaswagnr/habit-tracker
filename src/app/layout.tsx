import './globals.css'
import './fonts.css'

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
      <body className="font-['Avenir_Next']">{children}</body>
    </html>
  )
}