'use client'

import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

const geist = Geist({ subsets: ['latin'] })
const geistMono = Geist_Mono({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} ${geistMono.className}`} suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {/* هنا children بس، من غير Guard يضايق الصفحة الرئيسية */}
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}