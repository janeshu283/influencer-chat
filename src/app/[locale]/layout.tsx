import './globals.css'
import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientLayout from '@/components/layout/ClientLayout'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GifTalk',
  description: 'インフルエンサーとチャットをしよう',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
