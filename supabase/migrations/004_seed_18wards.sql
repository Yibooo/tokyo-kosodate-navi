-- =============================================
-- Phase2: 18区追加シードデータ
-- 23区完全対応（既存5区は変更なし）
-- 追加: 医療費助成18件 + 注目制度10件 = 28件
-- =============================================

DO $$
DECLARE pid UUID;
BEGIN

-- ============================================================
-- 全18区 共通: 子ども医療費助成（高校生まで・所得制限なし）
-- 東京都ほぼ全区が高校生まで無料を実施
-- ============================================================

-- 千代田区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '千代田区', '千代田区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '千代田区では0歳から高校卒業（18歳到達後の3月31日）まで医療費（保険診療内の入院・通院）が無料。千代田区は全国有数の高所得エリアながら医療費は完全無料で所得制限なし。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に千代田区役所へ申請',
  'https://www.city.chiyoda.lg.jp/kosei/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 中央区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '中央区', '中央区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '中央区では0歳から高校卒業まで医療費（保険診療内）が無料。中央区は日本橋・銀座エリアを擁し、子育て支援にも力を入れている。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に中央区役所へ申請',
  'https://www.city.chuo.lg.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 新宿区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '新宿区', '新宿区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '新宿区では0歳から高校卒業（18歳到達後の3月31日）まで医療費（保険診療内の入院・通院）が無料。多様な家族構成の子育て世帯を支援。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に新宿区役所へ申請',
  'https://www.city.shinjuku.lg.jp/kodomo/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 文京区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '文京区', '文京区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '文京区では0歳から高校卒業まで医療費（保険診療内）が無料。東大・医療機関が多く集まる文京区は子育て環境も充実している。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に文京区役所へ申請',
  'https://www.city.bunkyo.lg.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 台東区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '台東区', '台東区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '台東区では0歳から高校卒業（18歳到達後の3月31日）まで医療費（保険診療内の入院・通院）が無料。上野・浅草エリアを持つ台東区が子育て世帯を全面支援。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に台東区役所へ申請',
  'https://www.city.taito.lg.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 墨田区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '墨田区', '墨田区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '墨田区では0歳から高校卒業まで医療費（保険診療内）が無料。スカイツリーで有名な墨田区は住みやすい子育て環境を整備している。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に墨田区役所へ申請',
  'https://www.city.sumida.lg.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 大田区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '大田区', '大田区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '大田区では0歳から高校卒業（18歳到達後の3月31日）まで医療費（保険診療内の入院・通院）が無料。23区最大の面積を持つ大田区が子育て世帯を支援。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に大田区役所へ申請',
  'https://www.city.ota.tokyo.jp/seikatsu/kodomo/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 世田谷区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '世田谷区', '世田谷区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '世田谷区では0歳から高校卒業まで医療費（保険診療内）が無料。23区最大の人口を持つ世田谷区は子育て施策も充実しており、ファミリー世帯に人気のエリア。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に世田谷区役所へ申請',
  'https://www.city.setagaya.lg.jp/mokuji/kodomo/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 渋谷区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '渋谷区', '渋谷区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '渋谷区では0歳から高校卒業まで医療費（保険診療内）が無料。保育料無料化でも有名な渋谷区は医療費も完全無料で子育て世帯を強力支援。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に渋谷区役所へ申請',
  'https://www.city.shibuya.tokyo.jp/kodomo/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 中野区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '中野区', '中野区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '中野区では0歳から高校卒業まで医療費（保険診療内の入院・通院）が無料。交通利便性の高い中野区が子育て支援も充実。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に中野区役所へ申請',
  'https://www.city.tokyo-nakano.lg.jp/dept/400000/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 杉並区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '杉並区', '杉並区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '杉並区では0歳から高校卒業まで医療費（保険診療内）が無料。住宅街として人気の杉並区は子育て環境も整っており、ファミリー向けの施策が充実。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に杉並区役所へ申請',
  'https://www.city.suginami.tokyo.jp/guide/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 豊島区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '豊島区', '豊島区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '豊島区では0歳から高校卒業まで医療費（保険診療内）が無料。池袋を中心とする豊島区は「消滅可能性都市」からの再生として子育て支援に積極的に取り組む。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に豊島区役所へ申請',
  'https://www.city.toshima.lg.jp/1/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 北区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '北区', '北区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '北区では0歳から高校卒業（18歳到達後の3月31日）まで医療費（保険診療内の入院・通院）が無料。赤羽などの住宅エリアが広がる北区が子育て世帯を支援。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に北区役所へ申請',
  'https://www.city.kita.tokyo.jp/k-kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 荒川区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '荒川区', '荒川区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '荒川区では0歳から高校卒業まで医療費（保険診療内）が無料。都電荒川線（さくらトラム）沿いの下町情緒あふれる荒川区が子育て世帯を支援。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に荒川区役所へ申請',
  'https://www.city.arakawa.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 板橋区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '板橋区', '板橋区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '板橋区では0歳から高校卒業（18歳到達後の3月31日）まで医療費（保険診療内の入院・通院）が無料。豊かな自然と住宅地が広がる板橋区が子育て世帯を支援。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に板橋区役所へ申請',
  'https://www.city.itabashi.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 練馬区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '練馬区', '練馬区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '練馬区では0歳から高校卒業まで医療費（保険診療内）が無料。農地と住宅が共存する練馬区は子育て環境に優れ、多くのファミリーが暮らす。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に練馬区役所へ申請',
  'https://www.nerima-kodomoegao.jp/', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 足立区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '足立区', '足立区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '足立区では0歳から高校卒業（18歳到達後の3月31日）まで医療費（保険診療内の入院・通院）が無料。出産祝い金も手厚く、子育て世帯に優しい足立区。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に足立区役所へ申請',
  'https://www.city.adachi.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 葛飾区
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '葛飾区', '葛飾区 子ども医療費助成', '医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '葛飾区では0歳から高校卒業まで医療費（保険診療内）が無料。東京東部の下町情緒あふれる葛飾区が子育て世帯を全面支援。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に葛飾区役所へ申請',
  'https://www.city.katsushika.lg.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- ============================================================
-- 注目制度（各区の代表的な独自支援）
-- ============================================================

-- 千代田区: 出産お祝い金（第1子10万円・第2子以降20万円）
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '千代田区', '千代田区 出産お祝い金', '一時金',
  '千代田区在住の子どもが生まれた家庭に出産お祝い金を支給',
  '千代田区では区内在住で出産した家庭に出産お祝い金を支給。第1子：100,000円、第2子以降：200,000円と、子どもが増えるほど支援が手厚くなる千代田区独自の制度。',
  NULL, 100000,
  '第1子：100,000円 ／ 第2子以降：200,000円',
  '出生届提出後、千代田区役所子ども支援課に申請（出生後6ヶ月以内）',
  'https://www.city.chiyoda.lg.jp/kosei/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 6);

-- 中央区: 出産支援給付金
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '中央区', '中央区 出産支援給付金', '一時金',
  '中央区在住で出産した家庭に給付金を支給（区独自の上乗せあり）',
  '中央区では国の「出産・子育て応援交付金」（計10万円）に加えて、中央区独自の出産支援給付金を実施。妊娠届・出生届の際に支給される給付金で、育児用品や食料品などに使えるカタログギフトや現金で支給。',
  NULL, 100000,
  '国の交付金10万円に加え、中央区独自の給付金あり（詳細は区窓口で確認）',
  '妊娠届提出時・出生届提出時に中央区役所で案内',
  'https://www.city.chuo.lg.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 6);

-- 渋谷区: 保育料の完全無料化（全国初・最重要制度）
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '渋谷区', '渋谷区 保育料完全無料化（0〜5歳・全員対象）', '保育・教育',
  '0〜5歳の全子どもの認可保育所等の保育料が所得に関係なく無料（2020年〜）',
  '渋谷区は2020年4月から、国の幼児教育無償化（3〜5歳）に加え、0〜2歳についても全ての子どもの認可保育所・認定こども園等の保育料を無料化。所得制限なし、第1子から全員対象。日本初の0〜5歳全年齢無料化を実現した先進的な制度。認可外保育施設も最大月77,000円まで補助あり。',
  NULL, NULL,
  '0〜5歳全員の認可保育所等の保育料が完全無料（所得・世帯構成に関係なし）',
  '保育所入所申請時に自動適用（0〜2歳は区の認定が必要）',
  'https://www.city.shibuya.tokyo.jp/kodomo/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 71);

-- 世田谷区: 電動アシスト自転車購入費補助
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '世田谷区', '世田谷区 電動アシスト自転車等購入費補助', '物品・生活支援',
  '子育て世帯の電動アシスト自転車購入を補助（上限2万円）',
  '世田谷区では18歳未満の子どもがいる世帯（子育て世帯）を対象に、電動アシスト付自転車（チャイルドシート装着可・3人乗り対応含む）の購入費の一部を補助。坂道の多い世田谷で安全な送迎手段確保を支援。',
  NULL, 20000,
  '購入費の一部補助（上限20,000円）先着順',
  '世田谷区役所窓口で購入前に申請',
  'https://www.city.setagaya.lg.jp/mokuji/kodomo/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 練馬区: 電動アシスト自転車購入費補助
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '練馬区', '練馬区 電動アシスト自転車等購入費補助', '物品・生活支援',
  '子育て世帯の電動アシスト自転車購入を補助（上限2万円）',
  '練馬区では18歳未満の子どもがいる世帯（子育て世帯）を対象に、電動アシスト付自転車（チャイルドシート対応・3人乗り対応含む）の購入費の一部を補助。広い練馬区での安全な送迎手段確保を支援。',
  NULL, 20000,
  '購入費の一部補助（上限20,000円）先着順',
  '練馬区役所窓口で購入前に申請',
  'https://www.nerima-kodomoegao.jp/', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 215);

-- 足立区: 出産祝い金（第3子以降が特に手厚い）
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '足立区', '足立区 出産祝い金', '一時金',
  '区内在住の子どもが生まれた家庭に出産祝い金を支給（第3子以降は30万円）',
  '足立区では区内在住で出産した家庭に出産祝い金を支給。第1子：50,000円、第2子：100,000円、第3子以降：300,000円と、多子世帯に特に手厚い支援を実施。足立区の子育て支援策の中でも最も注目度が高い制度。',
  NULL, 50000,
  '第1子：50,000円 ／ 第2子：100,000円 ／ 第3子以降：300,000円',
  '出生届提出後、足立区役所子ども支援課に申請',
  'https://www.city.adachi.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 6);

-- 文京区: 出産・子育て応援交付金
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '文京区', '文京区 出産・子育て応援交付金', '一時金',
  '妊娠届・出生届時に合計10万円相当の給付金またはギフトを支給',
  '文京区では国の「出産・子育て応援交付金」を実施。妊娠届時に5万円分、出生届後に5万円分（計10万円）のギフトカタログや育児用品を支給。ハーバード大学などとも連携した文京区ならではの子育て支援策。',
  NULL, 100000,
  '妊娠届時5万円 ＋ 出生時5万円（合計10万円）',
  '妊娠届提出時に文京区役所で案内。出生後は別途申請が必要。',
  'https://www.city.bunkyo.lg.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 6);

-- 大田区: 出産祝い品
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '大田区', '大田区 出産・子育て応援交付金', '一時金',
  '妊娠届・出生届時に合計10万円相当の給付金・ギフトを支給',
  '大田区では国の「出産・子育て応援交付金」を実施。妊娠届時に5万円分、出生届後に5万円分（計10万円）のギフトカタログまたは現金相当を支給。羽田空港に隣接する大田区が子育て世帯を全力支援。',
  NULL, 100000,
  '妊娠届時5万円 ＋ 出生時5万円（合計10万円）',
  '妊娠届提出時に大田区役所で案内',
  'https://www.city.ota.tokyo.jp/seikatsu/kodomo/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 6);

-- 葛飾区: 出産祝い金
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '葛飾区', '葛飾区 出産・子育て応援交付金', '一時金',
  '妊娠届・出生届時に合計10万円相当の給付金・ギフトを支給',
  '葛飾区では国の「出産・子育て応援交付金」を実施。妊娠届時に5万円分、出生届後に5万円分（計10万円）のギフトカタログまたは現金相当を支給。',
  NULL, 100000,
  '妊娠届時5万円 ＋ 出生時5万円（合計10万円）',
  '妊娠届提出時に葛飾区役所で案内',
  'https://www.city.katsushika.lg.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 6);

-- 台東区: 出産・子育て応援交付金
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '台東区', '台東区 出産・子育て応援交付金', '一時金',
  '妊娠届・出生届時に合計10万円相当の給付金・ギフトを支給',
  '台東区では国の「出産・子育て応援交付金」を実施。妊娠届時に5万円分、出生届後に5万円分（計10万円）のギフトカタログまたは現金相当を支給。伝統ある下町文化の台東区が子育て世帯を応援。',
  NULL, 100000,
  '妊娠届時5万円 ＋ 出生時5万円（合計10万円）',
  '妊娠届提出時に台東区役所で案内',
  'https://www.city.taito.lg.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months) VALUES (pid, 0, 6);

END $$;
