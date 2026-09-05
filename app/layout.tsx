import type { Metadata } from 'next';
import './globals.css';

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || 'https://minella.in';

export const metadata: Metadata = {
  title: 'Minella Jewels — Anti-Tarnish Jewellery | Waterproof | Minimalist | India',
  description: 'Shop premium anti-tarnish, waterproof, minimalist jewellery online. 18K gold plated necklaces, earrings, bracelets, rings & anklets. Skin-safe, nickel-free. COD available across India.',
  keywords: 'anti tarnish jewellery, waterproof jewellery, minimalist jewellery India, gold plated jewellery, nickel free jewellery, anti tarnish necklace, COD jewellery India',
  authors: [{ name: 'Minella Jewels' }],
  metadataBase: new URL(STORE_URL),
  openGraph: {
    title: 'Minella Jewels — Anti-Tarnish Jewellery | India',
    description: 'Shop premium anti-tarnish, waterproof, minimalist jewellery. 18K gold plated. Skin-safe. COD across India.',
    url: STORE_URL,
    siteName: 'Minella Jewels',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: `${STORE_URL}/assets/images/og-home.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minella Jewels — Anti-Tarnish Jewellery | India',
    description: 'Shop premium anti-tarnish, waterproof, minimalist jewellery.',
    images: [`${STORE_URL}/assets/images/og-home.jpg`],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#B76E79" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="geo.region" content="IN-TN" />
        <meta name="geo.placename" content="Coimbatore, Tamil Nadu, India" />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-QSYZM26PGX" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-QSYZM26PGX');` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
