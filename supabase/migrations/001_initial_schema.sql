-- =============================================
-- 東京23区・子育て支援ナビゲーター
-- Initial Schema v1.0
-- =============================================

-- 制度レイヤー（国・都・区）
CREATE TYPE policy_layer AS ENUM ('national', 'tokyo', 'ward');

-- ドラフトステータス
CREATE TYPE policy_status AS ENUM ('draft', 'approved', 'rejected', 'archived');

-- =============================================
-- policies: 制度マスタテーブル
-- =============================================
CREATE TABLE policies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer           policy_layer NOT NULL,
  ward            TEXT,                          -- NULLなら国・都レベル（例: '港区'）
  name            TEXT NOT NULL,                 -- 制度名
  summary         TEXT NOT NULL,                 -- 概要（1〜2文）
  description     TEXT,                          -- 詳細説明
  amount_monthly  INTEGER,                       -- 月額換算（円）
  amount_lump     INTEGER,                       -- 一時金額（円）
  amount_note     TEXT,                          -- 金額補足（例: '第3子以降は1万5千円'）
  apply_method    TEXT,                          -- 申請方法の説明
  apply_url       TEXT,                          -- 申請先URL
  source_url      TEXT,                          -- スクレイピング元URL
  valid_from      DATE,                          -- 制度有効開始日
  valid_to        DATE,                          -- 制度有効終了日（NULLなら無期限）
  status          policy_status NOT NULL DEFAULT 'draft',
  scraped_at      TIMESTAMPTZ,                   -- スクレイピング実行日時
  approved_at     TIMESTAMPTZ,                   -- 承認日時
  approved_by     TEXT,                          -- 承認者（管理者メール等）
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- policy_conditions: 対象条件テーブル
-- =============================================
CREATE TABLE policy_conditions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id             UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,

  -- 子の年齢条件（月齢ベース）
  child_age_min_months  INTEGER,                 -- 対象最低月齢（例: 0 = 0歳〜）
  child_age_max_months  INTEGER,                 -- 対象最高月齢（例: 215 = 18歳未満）

  -- 出生順位条件
  birth_order_min       INTEGER,                 -- 最小出生順位（例: 1 = 第1子以上）
  birth_order_max       INTEGER,                 -- 最大出生順位（NULL = 上限なし）

  -- 世帯年収条件（万円）
  income_min_man_yen    INTEGER,                 -- 最低世帯年収（NULL = 下限なし）
  income_max_man_yen    INTEGER,                 -- 最高世帯年収（NULL = 上限なし）

  -- その他条件テキスト（構造化できない条件）
  other_conditions      TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- scrape_logs: スクレイピング実行ログ
-- =============================================
CREATE TABLE scrape_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_url      TEXT NOT NULL,
  target_name     TEXT NOT NULL,                 -- スクレイピング対象の名称
  layer           policy_layer NOT NULL,
  ward            TEXT,
  status          TEXT NOT NULL,                 -- 'success' | 'failed' | 'partial'
  policies_found  INTEGER DEFAULT 0,
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at     TIMESTAMPTZ
);

-- =============================================
-- インデックス
-- =============================================
CREATE INDEX idx_policies_layer ON policies(layer);
CREATE INDEX idx_policies_ward ON policies(ward);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policy_conditions_policy_id ON policy_conditions(policy_id);

-- =============================================
-- updated_at 自動更新トリガー
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER policies_updated_at
  BEFORE UPDATE ON policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- Row Level Security（Phase2のユーザー認証に備えて設定）
-- =============================================
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- 承認済み制度は全員が読める（匿名含む）
CREATE POLICY "approved_policies_public_read" ON policies
  FOR SELECT USING (status = 'approved');

-- 条件は承認済み制度に紐づくものだけ読める
CREATE POLICY "approved_conditions_public_read" ON policy_conditions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM policies p
      WHERE p.id = policy_conditions.policy_id AND p.status = 'approved'
    )
  );
