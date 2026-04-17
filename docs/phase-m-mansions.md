# Phase M — 新築マンションタブ 要件定義書

作成日: 2026-04-18  
対象リポジトリ: Yibooo/tokyo-kosodate-navi

---

## 目的

既存の「補助金・支援制度」「保育園情報β」タブに加え、**新築マンションタブ**を追加する。  
東京23区の新築マンション情報をMAP + 一覧表で表示し、子育て世帯の住まい探しを支援する。

---

## UI構成

```
ホームページ タブバー:
[💴補助金・支援制度] [🏫保育園情報β] [🏢新築マンション]

新築マンションタブ内:
  └── 区セレクター（23区）
        └── フィルターバー（ステータス / 引渡時期 / 総戸数 / 工法 / 廊下タイプ）
              ├── [🗺️マップビュー]   Leaflet + OpenStreetMap（無料）
              └── [📋一覧表ビュー]   横並び比較表（物件=列、属性=行）
```

### 一覧表レイアウト

- 添付画像（江古田・西国分寺・西荻窪…の比較表）と同形式
- **属性 = 行、物件 = 列** — 横スクロール対応
- 区内の全物件（フィルター後）を一度に表示

### マップビュー

- ライブラリ: `react-leaflet` + OpenStreetMap（完全無料）
- PINの色分け:
  - 🔵 建築予定
  - 🟠 建築中
  - 🟢 分譲中
- クリック時ポップアップ: マンション名・デベロッパー・総戸数・専有面積・引渡・公式リンク
- Next.js App Router対応: `dynamic(() => import(...), { ssr: false })` で遅延ロード

---

## フィルター仕様

| フィルター | 選択肢 |
|---|---|
| ステータス | 建築予定 / 建築中 / 分譲中（複数選択可） |
| 引渡時期 | 〜2025年 / 2026年 / 2027年 / 2028年以降 |
| 総戸数 | 〜30戸 / 31〜80戸 / 81戸以上 |
| 工法 | 直床 / 二重床 / 指定なし |
| 廊下タイプ | 内廊下のみ / 指定なし |

---

## データスキーマ

```typescript
// src/lib/seed-mansions.ts

export type MansionStatus = '建築予定' | '建築中' | '分譲中'

export interface MansionRecord {
  id:              string          // ユニークID（例: 'proud-nerima-2027'）
  name:            string          // マンション名
  developers:      string[]        // デベロッパー（共同開発対応）
  ward:            string          // 区（例: '世田谷区'）
  address:         string          // 住所
  lat:             number          // 緯度（Nominatim APIで取得）
  lng:             number          // 経度
  status:          MansionStatus
  floors:          number          // 階数
  total_units:     number          // 総戸数
  site_area:       number | null   // 敷地面積 m²
  area_min:        number | null   // 専有面積 最小 m²
  area_max:        number | null   // 専有面積 最大 m²
  completion:      string          // 建物竣工（例: '2027年3月下旬'）
  delivery:        string          // 引渡（例: '2027年4月上旬'）
  constructor:     string          // 施工会社
  parking:         string          // 駐車場（例: '24台（平置23・身障者1）'）
  bicycle_parking: number | null   // 駐輪場 台数
  ceiling_height:  string          // 天井高（例: '2450mm'）
  floor_method:    string          // 工法（直床/二重床/直床・Pタイプ二重床）
  disposer:        boolean         // ディスポーザー
  eco_type:        'ゼッチ' | '低炭素' | 'その他' | null
  corridor:        '内廊下' | '外廊下'
  url:             string          // 物件公式ページURL
  updated_at:      string          // データ更新日 YYYY-MM-DD
}
```

### 座標取得方針

住所 → 緯度/経度は **OpenStreetMap Nominatim API**（無料・rate limit 1req/sec）を  
スクレイピングスクリプト実行時に解決し、seed fileに確定値として埋め込む。

---

## スクレイピング対象デベロッパー（23区）

| # | デベロッパー | ブランド名 | M1確認結果 |
|---|---|---|---|
| 1 | 野村不動産 | プラウド | M1で確認 |
| 2 | 三井不動産レジデンシャル | パークホームズ / パークコート | M1で確認 |
| 3 | 住友不動産 | シティハウス / シティタワー | M1で確認 |
| 4 | 三菱地所レジデンス | ザ・パークハウス | M1で確認 |
| 5 | 東急不動産 | ブランズ | M1で確認 |
| 6 | 東京建物 | Brillia | M1で確認 |
| 7 | 大京 | ライオンズ | M1で確認 |
| 8 | 積水ハウス | グランドメゾン | M1で確認 |
| 9 | 伊藤忠都市開発 | クレヴィア | M1で確認 |
| 10 | 近鉄不動産 | プレミスト | M1で確認 |
| 11 | オープンハウス | — | M1で確認 |
| 12 | プレサンスコーポレーション | プレサンス | M1で確認 |
| 13 | 長谷工コーポレーション | — | M1で確認 |
| 14 | 大成建設 | — | M1で確認 |
| 15 | 小田急不動産 | オーベル | M1で確認 |

---

## 開発フェーズ

| Phase | 内容 | 状態 |
|---|---|---|
| **M1** | robots.txt/ToS確認 → スクレイピング可否仕分け → 初期seed data収集 → `seed-mansions.ts` + `mansions.ts` 作成 | 🚧 進行中 |
| **M2** | HomeTabにタブ追加 + 区セレクター + 横比較一覧表 + フィルターUI | 未着手 |
| **M3** | Leafletマップ統合（PIN・ポップアップ） | 未着手 |
| **M4** | `scripts/scrape-mansions.ts` 整備（月次手動実行用） | 未着手 |
| **M5** | 近郊10市対応（MVP完了後） | 未着手 |

---

## 対象エリア

- **初期リリース**: 東京23区
- **MVP後**: 近郊10市（武蔵野市・三鷹市・調布市・府中市・小金井市・西東京市・狛江市・国分寺市・国立市・立川市）

---

## 技術スタック

| 用途 | 採用技術 |
|---|---|
| マップ | react-leaflet + Leaflet + OpenStreetMap（無料） |
| 座標解決 | Nominatim API（無料・OSM） |
| データ形式 | TypeScript seed file（childcareと同方式） |
| スクレイピング | scripts/ 配下のNode.jsスクリプト（月次手動実行） |
| 更新頻度 | 月1回（ユーザーがClaudeに依頼して実行） |

---

## 非機能要件

- SSR不要（Client Component + dynamic import でLeafletをロード）
- Vercelデプロイ対象（追加インフラ不要）
- スクレイピングはCI/CDに組み込まず、手動スクリプト実行 → seed file更新 → PR → deploy の流れ
