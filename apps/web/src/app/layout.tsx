import type { Metadata, Viewport } from 'next';
import { Source_Serif_4, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

/* -------------------------------------------------------------------------- */
/*  Font loading — optimized via next/font with display=swap and subsetting   */
/* -------------------------------------------------------------------------- */

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-source-serif',
  display: 'swap',
  weight: ['400', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500', '700'],
});

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                  */
/* -------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: {
    default: 'Catatan — Beautiful Note-Taking',
    template: '%s | Catatan',
  },
  description:
    'Aplikasi catatan yang indah dan simpel untuk menulis, mengorganisir, dan menyimpan ide-ide kamu.',
  keywords: ['catatan', 'notes', 'note-taking', 'pwa', 'Indonesia'],
  authors: [{ name: 'Catatan Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#C4785B',
};

/* -------------------------------------------------------------------------- */
/*  Root Layout                                                               */
/* -------------------------------------------------------------------------- */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${sourceSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Blocking script to prevent flash of wrong theme (FOUWT) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('catatan-theme')||'system';var t=p;if(p==='system'){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
