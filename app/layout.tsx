import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LogiFlow — AI Logistics Optimization',
  description: 'AI-powered logistics management system with role-based dashboards',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
