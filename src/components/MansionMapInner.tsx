'use client'

// Leaflet CSS はここで import（SSR無効時のみ読み込まれる）
import 'leaflet/dist/leaflet.css'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import { STATUS_CONFIG, type MansionRecord, type MansionStatus } from '@/lib/mansions'

// =============================================
// カスタムマーカーアイコン（ステータス別カラー）
// =============================================

const PIN_COLORS: Record<MansionStatus, string> = {
  '建築予定': '#2563eb',   // blue-600
  '建築中':   '#ea580c',   // orange-600
  '分譲中':   '#16a34a',   // green-700
}

function createIcon(status: MansionStatus): L.DivIcon {
  const color = PIN_COLORS[status]
  return L.divIcon({
    html: `
      <div style="
        background:${color};
        width:14px;height:14px;
        border-radius:50%;
        border:2.5px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,0.45);
      "></div>
    `,
    className:   '',
    iconSize:    [14, 14],
    iconAnchor:  [7, 7],
    popupAnchor: [0, -10],
  })
}

// =============================================
// 地図中心を物件群に自動フィット
// =============================================

function MapBoundsUpdater({ mansions }: { mansions: MansionRecord[] }) {
  const map = useMap()
  const prevWard = useRef<string>('')

  useEffect(() => {
    if (mansions.length === 0) return
    const currentWard = mansions[0]?.ward ?? ''
    if (currentWard === prevWard.current) return
    prevWard.current = currentWard

    const bounds = L.latLngBounds(mansions.map(m => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [mansions, map])

  return null
}

// =============================================
// メインマップコンポーネント
// =============================================

interface Props {
  mansions: MansionRecord[]
}

// 東京23区中心付近
const TOKYO_CENTER: [number, number] = [35.689, 139.762]

export default function MansionMapInner({ mansions }: Props) {
  return (
    <div className="relative">
      {/* 凡例 */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow px-3 py-2 text-xs flex flex-col gap-1.5">
        {(Object.entries(STATUS_CONFIG) as [MansionStatus, typeof STATUS_CONFIG[MansionStatus]][]).map(
          ([status, cfg]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shrink-0"
                style={{ backgroundColor: PIN_COLORS[status], boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              />
              <span className="text-gray-700 font-medium">{cfg.label}</span>
            </div>
          )
        )}
      </div>

      {/* Leaflet マップ */}
      <MapContainer
        center={TOKYO_CENTER}
        zoom={12}
        style={{ height: '480px', width: '100%', borderRadius: '0 0 1rem 1rem' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater mansions={mansions} />

        {mansions.map(m => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={createIcon(m.status)}
          >
            <Popup minWidth={220} maxWidth={260}>
              <MansionPopup mansion={m} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {mansions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-[999] rounded-b-2xl">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">📍</div>
            <p className="text-sm">条件に合う物件がありません</p>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================
// ポップアップ内容
// =============================================

function MansionPopup({ mansion: m }: { mansion: MansionRecord }) {
  const sc = STATUS_CONFIG[m.status]
  return (
    <div className="text-xs leading-relaxed min-w-[200px]">
      {/* 物件名 + ステータス */}
      <div className="font-bold text-sm text-gray-900 mb-1 leading-tight">{m.name}</div>
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full mb-2 ${sc.bg} ${sc.color}`}>
        {sc.pin} {sc.label}
      </span>

      {/* デベロッパー */}
      <div className="text-gray-500 mb-1">{m.developers.join(' / ')}</div>

      {/* 主要スペック */}
      <table className="w-full text-xs border-collapse">
        <tbody>
          {m.total_units && (
            <tr>
              <td className="text-gray-400 pr-2 py-0.5 whitespace-nowrap">総戸数</td>
              <td className="font-semibold text-gray-800">{m.total_units}戸</td>
            </tr>
          )}
          {(m.area_min || m.area_max) && (
            <tr>
              <td className="text-gray-400 pr-2 py-0.5 whitespace-nowrap">専有面積</td>
              <td className="font-semibold text-gray-800">
                {m.area_min && m.area_max
                  ? `${m.area_min}〜${m.area_max}㎡`
                  : `${m.area_min ?? m.area_max}㎡〜`}
              </td>
            </tr>
          )}
          {m.delivery && (
            <tr>
              <td className="text-gray-400 pr-2 py-0.5 whitespace-nowrap">引渡</td>
              <td className="font-semibold text-gray-800">{m.delivery}</td>
            </tr>
          )}
          {m.floors && (
            <tr>
              <td className="text-gray-400 pr-2 py-0.5 whitespace-nowrap">階数</td>
              <td className="font-semibold text-gray-800">{m.floors}階建て</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 公式リンク */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <Link
          href={m.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
        >
          公式ページを見る →
        </Link>
      </div>
    </div>
  )
}
