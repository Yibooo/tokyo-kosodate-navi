'use client'

// Leaflet CSS はここで import（SSR無効時のみ読み込まれる）
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
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
    popupAnchor: [0, -14],
  })
}

// =============================================
// ポップアップ HTML（leaflet.bindPopup 用）
// =============================================

function buildPopupHtml(m: MansionRecord): string {
  const sc   = STATUS_CONFIG[m.status]
  const color = PIN_COLORS[m.status]

  const unitsRow = m.total_units
    ? `<tr><td style="color:#9ca3af;padding-right:8px;padding-bottom:2px;white-space:nowrap">総戸数</td><td style="font-weight:600;color:#1f2937">${m.total_units}戸</td></tr>`
    : ''
  const areaRow = (m.area_min || m.area_max)
    ? `<tr><td style="color:#9ca3af;padding-right:8px;padding-bottom:2px;white-space:nowrap">専有面積</td><td style="font-weight:600;color:#1f2937">${
        m.area_min && m.area_max
          ? `${m.area_min}〜${m.area_max}㎡`
          : `${m.area_min ?? m.area_max}㎡〜`
      }</td></tr>`
    : ''
  const deliveryRow = m.delivery
    ? `<tr><td style="color:#9ca3af;padding-right:8px;padding-bottom:2px;white-space:nowrap">引渡</td><td style="font-weight:600;color:#1f2937">${m.delivery}</td></tr>`
    : ''
  const floorsRow = m.floors
    ? `<tr><td style="color:#9ca3af;padding-right:8px;padding-bottom:2px;white-space:nowrap">階数</td><td style="font-weight:600;color:#1f2937">${m.floors}階建て</td></tr>`
    : ''

  return `
    <div style="font-size:12px;line-height:1.6;min-width:200px">
      <div style="font-weight:700;font-size:14px;color:#111827;margin-bottom:4px;line-height:1.3">${m.name}</div>
      <span style="
        display:inline-flex;align-items:center;gap:4px;
        font-size:11px;font-weight:700;padding:2px 8px;
        border-radius:9999px;margin-bottom:8px;
        background-color:${sc.bg.replace('bg-', '').includes('[') ? '' : ''};
        color:${color};
        border:1.5px solid ${color};
      ">${sc.pin} ${sc.label}</span>
      <div style="color:#6b7280;margin-bottom:6px">${m.developers.join(' / ')}</div>
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        <tbody>
          ${unitsRow}${areaRow}${deliveryRow}${floorsRow}
        </tbody>
      </table>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #f3f4f6">
        <a
          href="${m.url}"
          target="_blank"
          rel="noopener noreferrer"
          style="font-size:11px;font-weight:700;color:#2563eb;text-decoration:none"
        >公式ページを見る →</a>
      </div>
    </div>
  `
}

// =============================================
// クラスタリングレイヤー（leaflet.markercluster 直接操作）
// =============================================

function ClusterLayer({ mansions }: { mansions: MansionRecord[] }) {
  const map       = useMap()
  const mcgRef    = useRef<L.MarkerClusterGroup | null>(null)

  useEffect(() => {
    // 既存クラスタを削除
    if (mcgRef.current) {
      map.removeLayer(mcgRef.current)
      mcgRef.current = null
    }
    if (mansions.length === 0) return

    // クラスタグループ生成
    const mcg = L.markerClusterGroup({
      maxClusterRadius:    50,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom:   true,
      disableClusteringAtZoom: 17,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        // 件数に応じてサイズを変える
        const size  = count < 5 ? 34 : count < 15 ? 40 : 46
        return L.divIcon({
          html: `
            <div style="
              width:${size}px;height:${size}px;
              border-radius:50%;
              background:rgba(37,99,235,0.85);
              border:3px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.35);
              display:flex;align-items:center;justify-content:center;
              font-size:${count < 10 ? 13 : 11}px;
              font-weight:700;color:white;
              line-height:1;
            ">${count}</div>
          `,
          className:  '',
          iconSize:   [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      },
    })

    // 各物件をマーカーとして追加
    for (const m of mansions) {
      const marker = L.marker([m.lat, m.lng], { icon: createIcon(m.status) })
      marker.bindPopup(buildPopupHtml(m), { minWidth: 220, maxWidth: 260 })
      mcg.addLayer(marker)
    }

    map.addLayer(mcg)
    mcgRef.current = mcg

    // fitBounds
    const bounds = L.latLngBounds(mansions.map(m => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })

    return () => {
      if (mcgRef.current) {
        map.removeLayer(mcgRef.current)
        mcgRef.current = null
      }
    }
  // mansions が変わったときだけ再実行（mapは不変）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mansions])

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
        {/* クラスタ凡例 */}
        <div className="flex items-center gap-2 pt-1 mt-0.5 border-t border-gray-100">
          <div
            className="w-5 h-5 rounded-full border-2 border-white shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: 'rgba(37,99,235,0.85)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            n
          </div>
          <span className="text-gray-500">複数物件</span>
        </div>
      </div>

      {/* Leaflet マップ */}
      <MapContainer
        center={TOKYO_CENTER}
        zoom={12}
        style={{ height: '620px', width: '100%', borderRadius: '0 0 1rem 1rem' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClusterLayer mansions={mansions} />
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
