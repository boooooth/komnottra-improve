import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Komnottra · កំណត់ត្រា | Cambodia Workplace Receipt Ledger',
  description: 'Smart automated dual-currency receipt scanning and finance expense reconciliation for Cambodian businesses.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="km">
      <body>{children}</body>
    </html>
  );
}
