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
      <body className="w-full m-0 p-0">
        <main className="w-full">
          {children}
        </main>
      </body>
    </html>
  )
}