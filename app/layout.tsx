import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'PHONY - Engineered to Feel Alive',
  description: 'High-end product launch page for PHONY flagship smartphone lineup featuring cinematic 3D motion, live interactive specs, battery calculator, and comparison engine.',
  openGraph: {
    title: 'PHONY - Engineered to Feel Alive',
    description: 'High-end product launch page for PHONY flagship smartphone lineup featuring cinematic 3D motion, live interactive specs, battery calculator, and comparison engine.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PHONY - Engineered to Feel Alive',
    description: 'High-end product launch page for PHONY flagship smartphone lineup featuring cinematic 3D motion, live interactive specs, battery calculator, and comparison engine.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@500;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="bg-[#07080c] text-[#f1f5f9] selection:bg-[#00e5ff]/30 selection:text-white antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
