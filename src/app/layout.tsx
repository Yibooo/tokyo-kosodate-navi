import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '東京23区 子育て支援ナビ',
  description: '港区・品川区・目黒区・江東区・江戸川区の子育て支援制度を一括検索。国・東京都・区の制度をまとめて確認。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 text-gray-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
