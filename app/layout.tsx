import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liquidaciones',
  description: 'Generador de liquidaciones',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
