import type { ReactNode } from 'react';

import type { Metadata, Viewport } from 'next';
import { Inter, Manrope } from 'next/font/google';

// import localFont from 'next/font/local';

import { ThemeProvider } from 'next-themes';

import '@/app/globals.css';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Decypharr',
    description: 'A complete revamp of the UI.'
};

export const viewport: Viewport = {
    maximumScale: 1
};

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
        // https://react.dev/reference/react-dom/client/hydrateRoot#suppressing-unavoidable-hydration-mismatch-errors
        <html suppressHydrationWarning lang='en'>
            <body className={`${inter.className} bg-background text-foreground min-h-[100dvh] antialiased`}>
                <ThemeProvider attribute='class'>
                    <Header />
                    <main>{children}</main>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
};

export default Layout;
