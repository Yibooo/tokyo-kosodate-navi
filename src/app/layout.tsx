import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '首都圏新築マンションナビ',
  description: '首都圏の新築マンション情報を一括検索。補助金・保育園情報も合わせて確認できます。',
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
