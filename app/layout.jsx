import '../src/index.css';

export const metadata = {
  title: 'eldroplus — Live Healthy, Better Tomorrow',
  description: 'eldroplus — Smart phone focused Progressive Web Application for health tracking.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'eldroplus',
  },
  icons: {
    icon: [
      { url: '/eldropluslogomain.png', sizes: '192x192' },
      { url: '/favicon.ico' }
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#84b49c',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface font-body antialiased">
        {children}
      </body>
    </html>
  );
}
