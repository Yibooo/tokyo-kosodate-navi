// SSR無効のdynamic importラッパー
// Leaflet はブラウザ専用（window/document を直接参照するため SSR 不可）
import dynamic from 'next/dynamic'
import type { MansionRecord } from '@/lib/mansions'

const MansionMapInner = dynamic(
  () => import('@/components/MansionMapInner'),
  {
    ssr:     false,
    loading: () => (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-b-2xl text-gray-400 text-sm"
        style={{ height: '480px' }}
      >
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">🗺️</div>
          <p>地図を読み込み中...</p>
        </div>
      </div>
    ),
  },
)

interface Props {
  mansions: MansionRecord[]
}

export default function MansionMap({ mansions }: Props) {
  return <MansionMapInner mansions={mansions} />
}
