export const metadata = {
  title: 'Strength Tracker',
  description: 'Track your workouts, sets, reps, and health stats',
  manifest: '/manifest.json',
  themeColor: '#1e40af',
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
