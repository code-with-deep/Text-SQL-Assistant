import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'QueryAI — Natural Language Text-to-SQL Assistant',
  description: 'Transform plain English questions into SQL queries, interactive charts, and clear explanations instantly.',
  keywords: 'text-to-sql, AI SQL generator, natural language database assistant, business intelligence, query builder',
  authors: [{ name: 'DeepMind Advanced Coding Agent' }],
};

// Client component wrapper inside layout for silent JWT initialization on application load
import ClientAuthInitializer from '@/components/auth/ClientAuthInitializer';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg-base text-text-primary font-sans flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ClientAuthInitializer>
            {children}
            <Toaster 
              position="bottom-right" 
              toastOptions={{
                className: 'bg-bg-elevated border border-border text-text-primary rounded-xl shadow-2xl',
                style: { fontFamily: 'var(--font-sans)' }
              }}
            />
          </ClientAuthInitializer>
        </ThemeProvider>
      </body>
    </html>
  );
}
