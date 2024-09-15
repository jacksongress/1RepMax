import { AuthProvider } from "../lib/contexts/AuthContext";
import "./globals.css";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '1 Rep Max',
  description: 'Track your workouts and progress',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body suppressHydrationWarning={true}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
