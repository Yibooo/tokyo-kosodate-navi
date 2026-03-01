-- =============================================
-- Phase1.5 データ拡充: categoryカラム追加 + 25件追加
-- 保育料無償化 / 自転車補助 / 住宅ローン控除 / 乳児養育手当 etc.
-- =============================================

-- Step 1: category カラムを追加
ALTER TABLE policies ADD COLUMN IF NOT EXISTS category TEXT;

-- Step 2: 既存14件にカテゴリを設定
UPDATE policies SET category = '給付金・手当'   WHERE name = '児童手当';
UPDATE policies SET category = '一時金'         WHERE name = '出産育児一時金';
UPDATE policies SET category = '給付金・手当'   WHERE name = '018サポート（東京都）';
UPDATE policies SET category = '一時金'         WHERE name = '東京都 赤ちゃんファースト';
UPDATE policies SET category = '医療費助成'     WHERE name LIKE '%子ども医療費助成%';
UPDATE policies SET category = '一時金'         WHERE name LIKE '%出産祝金%';
UPDATE policies SET category = '一時金'         WHERE name LIKE '%誕生祝品%';
UPDATE policies SET category = '一時金'         WHERE name LIKE '%応援交付金%';
UPDATE policies SET category = '一時金'         WHERE name LIKE '%バースデーサポート%';
UPDATE policies SET category = '育児サービス'   WHERE name LIKE '%こんにちは赤ちゃん%';

-- Step 3: 25件の新制度を追加
DO $$
DECLARE pid UUID;
BEGIN

-- ============================================================
-- 国 (National) 追加6件
-- ============================================================

-- 幼児教育・保育の無償化（3〜5歳）
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('national', NULL, '幼児教育・保育の無償化（3〜5歳）', '保育・教育',
  '3〜5歳全員の認可保育所・幼稚園等の保育料が無料',
  '子ども・子育て支援法に基づき、3歳〜5歳（年少〜年長）の全ての子どもを対象に、認可保育所・幼稚園・認定こども園等の保育料が無料。認可外保育施設（企業主導型保育・地方裁量型等）も月37,000円まで補助。2019年10月開始。所得制限なし。',
  NULL, NULL,
  '認可保育所・幼稚園等の保育料が月0円（認可外保育施設は月3.7万円まで補助）',
  '保育所・幼稚園等の入所手続き時に自動適用（別途申請は原則不要、施設に確認を）',
  'https://www.cfa.go.jp/policies/kokoseido/mushouka/', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 36, 71, NULL);

-- ---

-- 幼児教育・保育の無償化（0〜2歳・住民税非課税世帯）
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('national', NULL, '幼児教育・保育の無償化（0〜2歳・低所得世帯）', '保育・教育',
  '住民税非課税世帯（年収200万円以下目安）の0〜2歳は認可保育所の保育料が無料',
  '0〜2歳の子どもがいる住民税非課税世帯では、認可保育所等の保育料が無料。認可外保育施設も月42,000円（0歳）または月37,000円（1〜2歳）まで補助。国の幼児教育・保育の無償化の一環として2019年から実施。',
  NULL, NULL,
  '住民税非課税世帯は認可保育所の保育料が無料（認可外は月3.7〜4.2万円まで補助）',
  '保育所入所申請時に自動判定（住民税非課税証明書が必要な場合あり）',
  'https://www.cfa.go.jp/policies/kokoseido/mushouka/', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 35, 200);

-- ---

-- 育児休業給付金（雇用保険）
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('national', NULL, '育児休業給付金（雇用保険）', '雇用・休業',
  '育児休業中に休業前賃金の最大67%が最長2年間支給される',
  '雇用保険に加入している労働者が育児休業を取得した場合、育休開始から180日間は休業前賃金の67%、181日目以降は50%が最長2年間（子が2歳になるまで）支給される。両親ともに育休を取得した場合は「パパ・ママ育休プラス」により最長1年2ヶ月まで延長可。2025年度から給付率が最大80%に引き上げ予定。',
  NULL, NULL,
  '賃金の67%（6ヶ月経過後は50%）を最長23ヶ月支給。例：月収30万円の場合→月約20万円',
  'ハローワークに申請（育休開始後、事業主を通じて2ヶ月ごとに申請）',
  'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000158500.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 23, NULL);

-- ---

-- 出生時育児休業給付金（産後パパ育休）
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('national', NULL, '出生時育児休業給付金（産後パパ育休）', '雇用・休業',
  '産後8週以内に最大28日間の育休を取得すると賃金の67%が支給',
  '2022年10月施行の「産後パパ育休」制度。子どもの出生後8週間以内に最大28日間の育児休業を取得すると、雇用保険から休業前賃金の67%が支給される。2回に分割して取得することも可能。育休と社会保険料免除も適用される。',
  NULL, NULL,
  '最大28日間、賃金の67%を支給（例：月収30万円×67%÷30日×28日＝約18.8万円）',
  'ハローワークへ申請（子の出生から8週間以内に育休開始・申請が必要）',
  'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000158500.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 2, NULL);

-- ---

-- 高等学校等就学支援金（高校授業料無償化）
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('national', NULL, '高等学校等就学支援金（高校授業料無償化）', '保育・教育',
  '年収910万円未満の世帯の高校授業料が国から支援される',
  '公立高校の授業料（年11.88万円相当）が支援される。年収590万円未満の世帯は私立高校の授業料もほぼ無償化（上限年39.6万円）。高専・専修学校等も対象。所得に応じた加算制度あり。',
  NULL, NULL,
  '公立高校：年間11.88万円分を支援 ／ 年収590万未満：私立高校も最大年39.6万円を支援',
  '在籍する高校等を通じて申請（毎年度更新）',
  'https://www.mext.go.jp/a_menu/shotou/mushouka/index.htm', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 180, 215, 910);

-- ---

-- 住宅ローン控除（子育て世帯・若者夫婦世帯特例）
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('national', NULL, '住宅ローン控除（子育て世帯・若者夫婦世帯特例）', '税制優遇',
  '子育て世帯は住宅ローン控除の借入限度額が一般より大幅に優遇される',
  '2024〜2025年度入居の子育て世帯（18歳以下の子あり）・若者夫婦世帯は、住宅ローン控除の借入限度額が一般より引き上げられる。長期優良住宅等：5,000万円（一般は4,500万円）、ZEH住宅：4,500万円（一般は3,500万円）、省エネ住宅：4,000万円（一般は3,000万円）。控除率0.7%・控除期間13年間。合計所得2,000万円以下が対象。',
  NULL, NULL,
  '長期優良住宅等：借入限度額5,000万円 → 年最大35万円の税控除（13年間で最大455万円）',
  '確定申告または年末調整（初年度のみ確定申告必須、入居翌年3月15日まで）',
  'https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk2_000017.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 215, 2000);

-- ============================================================
-- 東京都 (Tokyo) 追加4件
-- ============================================================

-- 東京都 私立幼稚園等保護者補助金
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('tokyo', NULL, '東京都 私立幼稚園等保護者補助金', '保育・教育',
  '私立幼稚園等に通う3〜5歳の保育料を国の無償化に都が上乗せして補助',
  '東京都が私立幼稚園・認定こども園（幼稚園型）等に通う3〜5歳の子どもの保護者に補助金を支給。国の幼児教育無償化（月25,700円上限）に加えて、都が独自に上乗せ補助を実施。年収に応じて補助額が異なり、低所得世帯ほど補助が厚い。',
  NULL, NULL,
  '国の無償化（月最大25,700円）に加え、都が独自に上乗せ補助（所得に応じて変動）',
  '在籍する幼稚園等を通じて申請（毎年度更新）',
  'https://www.metro.tokyo.lg.jp/tosei/hodohappyo/press/2023/04/18/05.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 36, 71, NULL);

-- ---

-- 東京都 ベビーシッター利用支援事業
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('tokyo', NULL, '東京都 ベビーシッター利用支援事業', '育児サービス',
  'ベビーシッターを1時間150円（最大1日9時間）で利用できる',
  '東京都が実施するベビーシッター利用支援。認可保育所等に入所できていない0〜2歳の子どもがいる家庭が対象。認定事業者のベビーシッターを通常料金の大幅割引で利用可能（利用者負担：1時間あたり150円）。育児や急な用事の際に活用できる。',
  NULL, NULL,
  '1時間150円（通常2,000〜3,000円を都が補助）、1日最大9時間・月160時間まで利用可',
  '東京都の専用窓口または区市町村の窓口で申請（保育所未入所の証明が必要）',
  'https://www.fukushi.metro.tokyo.lg.jp/kodomo/hoiku/babysitter.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 35, NULL);

-- ---

-- 東京都 高校生等への授業料支援（都独自）
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('tokyo', NULL, '東京都 高校生等への授業料支援（都独自）', '保育・教育',
  '国の就学支援金に上乗せし、都内私立高校の授業料を実質無償化',
  '東京都は2024年度から、国の就学支援金（最大年39.6万円）に加えて都独自の補助を実施し、都内私立高校等の授業料を実質無償化（上限年59.4万円）。2025年度からは所得制限を撤廃し、全所得世帯を対象に拡大予定。都内の私立高校は実質的に授業料無料となる。',
  NULL, NULL,
  '都内私立高校の授業料が実質無償（都が年間最大59.4万円を補助、所得制限撤廃予定）',
  '在籍する高校等を通じて申請（毎年度更新）',
  'https://www.metro.tokyo.lg.jp/tosei/hodohappyo/press/2024/01/30/17.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 180, 215, NULL);

-- ---

-- 東京都 産後ケア事業
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('tokyo', NULL, '東京都 産後ケア事業費補助', '育児サービス',
  '産後ケア施設・助産院での宿泊・日帰りケアの利用料を大幅補助',
  '東京都が区市町村の産後ケア事業を補助することで、産後ケア施設・助産院でのデイサービス（日帰り）・ショートステイ（宿泊）型のケアを低負担で利用可能。都と区が費用の大半を補助し、利用者の自己負担を数百円〜数千円程度に軽減する。',
  NULL, NULL,
  '利用者自己負担：数百円〜数千円/回（通常1回5,000〜25,000円の大半を都・区が補助）',
  '居住区の保健センター等に相談・申請（産後4ヶ月未満が多いが区により異なる）',
  'https://www.fukushi.metro.tokyo.lg.jp/kodomo/madoguchi/sango.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 4, NULL);

-- ============================================================
-- 港区 (Minato-ku) 追加3件
-- ============================================================

-- 港区 認証保育所等利用補助金
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '港区', '港区 認証保育所等利用補助金', '保育・教育',
  '認証保育所等を利用する0〜2歳の子に月最大30,000円を補助',
  '港区では認証保育所・小規模保育所・家庭的保育事業を利用する0〜2歳の子どもの保護者に対し、利用料の一部を補助。認可保育所との保育料差額を軽減するための制度で、所得に応じて月最大30,000円の補助を受けられる。',
  30000, NULL,
  '月最大30,000円を補助（所得により補助額が異なる場合あり）',
  '港区役所子ども家庭支援センター等にて申請（保育施設入所と同時に手続き可）',
  'https://www.city.minato.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 35, NULL);

-- ---

-- 港区 ベビーシッター利用支援
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '港区', '港区 ベビーシッター利用支援', '育児サービス',
  '都の支援（1時間150円）に加え、港区独自でベビーシッター利用料をさらに補助',
  '東京都のベビーシッター利用支援事業（1時間150円）に加えて、港区独自の補助を実施。認可保育所未入所の乳幼児を持つ家庭を中心に、ベビーシッター利用料の自己負担額を区がさらに軽減する。育児と仕事の両立を支援。',
  NULL, NULL,
  '都の支援（1時間150円）に加え、港区独自の上乗せ補助あり（詳細は区窓口で確認）',
  '港区役所子ども家庭支援センターに申請',
  'https://www.city.minato.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 35, NULL);

-- ---

-- 港区 産後ケア事業
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '港区', '港区 産後ケア事業', '育児サービス',
  '産後4ヶ月未満の母子を対象に助産院等でのケアを補助（最大7日間）',
  '港区では産後4ヶ月未満の母子を対象に、助産院・医療機関等での産後ケア（ショートステイ・デイサービス）を補助。区民は最大7日間利用可能で、利用料の大半を港区が補助（1日あたりの自己負担：デイ約1,500円・ショートステイ約3,000円程度）。',
  NULL, NULL,
  '最大7日間利用可（自己負担：デイ約1,500円・宿泊約3,000円程度）',
  '港区保健センターまたは子ども家庭支援センターへ相談・申請',
  'https://www.city.minato.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 4, NULL);

-- ============================================================
-- 品川区 (Shinagawa-ku) 追加3件
-- ============================================================

-- 品川区 私立幼稚園就園奨励費補助金
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '品川区', '品川区 私立幼稚園就園奨励費補助金', '保育・教育',
  '私立幼稚園等に通う3〜5歳の子どもの保育料を区が補助',
  '品川区では国の幼児教育無償化（月25,700円上限）に加えて、品川区独自の補助を実施。私立幼稚園・認定こども園（幼稚園型）に通う3〜5歳の子どもを対象に、保育料の一部を品川区が上乗せ補助する。',
  NULL, NULL,
  '国の無償化（月最大25,700円）に加え、品川区が独自に上乗せ補助',
  '在籍する幼稚園等を通じて申請（毎年度更新）',
  'https://www.city.shinagawa.tokyo.jp/PC/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 36, 71, NULL);

-- ---

-- 品川区 電動アシスト自転車等購入費補助
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '品川区', '品川区 電動アシスト自転車等購入費補助', '物品・生活支援',
  '子育て世帯が電動アシスト自転車を購入する際に購入費の1/2（上限2万円）を補助',
  '品川区では18歳未満の子どもがいる世帯（子育て世帯）を対象に、電動アシスト自転車（チャイルドシート装着可能なもの・3人乗り対応含む）の購入費の1/2相当（上限20,000円）を補助。安全な子どもの送迎手段確保を支援する品川区独自の施策。',
  NULL, 20000,
  '購入費の1/2を補助（上限20,000円）。先着順のため早めに申請を',
  '品川区役所子育て支援課の窓口に購入前に申請（レシートまたは領収書が必要）',
  'https://www.city.shinagawa.tokyo.jp/PC/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 215, NULL);

-- ---

-- 品川区 産後ケア事業
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '品川区', '品川区 産後ケア事業', '育児サービス',
  '産後間もない母子を対象に、助産師等によるケアをほぼ無料で受けられる',
  '品川区では産後間もない母子を対象に、助産院・医療機関等での産後ケア（デイサービス・ショートステイ）を補助。身体的回復の支援・授乳指導・育児相談等を実施。品川区民は利用料の大半を区が負担し、自己負担は1日数百円〜数千円程度。',
  NULL, NULL,
  '自己負担を大幅軽減（デイサービス・ショートステイ利用可、産後概ね4ヶ月未満）',
  '品川区保健センターへ相談・申請（産後概ね4ヶ月未満）',
  'https://www.city.shinagawa.tokyo.jp/PC/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 4, NULL);

-- ============================================================
-- 目黒区 (Meguro-ku) 追加3件
-- ============================================================

-- 目黒区 私立幼稚園就園奨励費補助
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '目黒区', '目黒区 私立幼稚園就園奨励費補助', '保育・教育',
  '私立幼稚園等に通う3〜5歳の保育料を区が補助',
  '目黒区では国の幼児教育無償化に加えて、目黒区独自の上乗せ補助を実施。私立幼稚園・認定こども園（幼稚園型）等に通う3〜5歳の子どもを対象に、保育料の一部を目黒区が補助する。所得に応じて補助額が変わる場合あり。',
  NULL, NULL,
  '国の無償化（月最大25,700円）に加え、目黒区が独自に上乗せ補助',
  '在籍する幼稚園等を通じて申請',
  'https://www.city.meguro.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 36, 71, NULL);

-- ---

-- 目黒区 ベビーシッター利用支援
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '目黒区', '目黒区 ベビーシッター利用支援', '育児サービス',
  '都の支援（1時間150円）に加え、目黒区独自でベビーシッター利用料を補助',
  '東京都のベビーシッター利用支援事業（1時間150円）に加えて、目黒区独自の補助を実施。認可保育所等に入所できていない0〜2歳の乳幼児を持つ家庭を対象に、ベビーシッター利用料をさらに軽減する。',
  NULL, NULL,
  '都の支援（1時間150円）に加え、目黒区独自の上乗せ補助あり',
  '目黒区役所子育て支援課に申請',
  'https://www.city.meguro.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 35, NULL);

-- ---

-- 目黒区 産後ケア支援事業
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '目黒区', '目黒区 産後ケア支援事業', '育児サービス',
  '産後の母子に助産師等によるケアを補助（デイ・ショートステイ）',
  '目黒区では産後間もない母子（概ね産後4ヶ月未満）を対象に、助産院等での産後ケアを補助。授乳支援・育児相談・母体回復支援を行う。利用料の大半を区が負担し、デイサービス・ショートステイ型を低負担で利用可能。',
  NULL, NULL,
  '大幅な自己負担軽減（デイ・ショートステイ利用可、産後4ヶ月未満）',
  '目黒区保健センターに相談・申請',
  'https://www.city.meguro.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 4, NULL);

-- ============================================================
-- 江東区 (Koto-ku) 追加3件
-- ============================================================

-- 江東区 私立幼稚園就園奨励費補助
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '江東区', '江東区 私立幼稚園就園奨励費補助', '保育・教育',
  '私立幼稚園等に通う3〜5歳の保育料を区が補助',
  '江東区では国の幼児教育無償化に加えて、江東区独自の補助を実施。私立幼稚園・認定こども園等に通う3〜5歳の子どもを対象に保育料の一部を補助する。所得に応じて補助額が変わる場合あり。',
  NULL, NULL,
  '国の無償化に加え、江東区が独自に上乗せ補助（所得に応じて異なる）',
  '在籍する幼稚園等を通じて申請（毎年度更新）',
  'https://www.city.koto.lg.jp/390101/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 36, 71, NULL);

-- ---

-- 江東区 電動アシスト自転車等購入費補助
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '江東区', '江東区 電動アシスト自転車等購入費補助', '物品・生活支援',
  '子育て世帯が電動アシスト自転車（3人乗り対応含む）購入時に購入費の一部を補助',
  '江東区では18歳未満の子どもがいる世帯（子育て世帯）を対象に、電動アシスト付自転車（チャイルドシート対応・3人乗り対応等）の購入費の一部を補助。安全な子どもの送迎手段確保を目的とした江東区の支援策。',
  NULL, 20000,
  '購入費の一部補助（上限20,000円、先着順のため予算が無くなり次第終了）',
  '江東区役所窓口に購入前に申請（予算に限りあり、年度早めに申請を）',
  'https://www.city.koto.lg.jp/390101/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 215, NULL);

-- ---

-- 江東区 産後家庭支援員派遣事業
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '江東区', '江東区 産後家庭支援員派遣事業', '育児サービス',
  '産後の家庭に家庭支援員を派遣し、育児・家事を支援（所得に応じて実質無料〜）',
  '江東区では産後間もない（原則産後4ヶ月未満）家庭に、家庭支援員（ヘルパー）を派遣。育児支援・家事援助・育児相談などを行う。利用料は所得に応じた負担（低所得世帯は無料）。産後の孤立や育児不安を軽減するための支援。',
  NULL, NULL,
  '1時間あたり数百円〜（所得に応じた負担。低所得世帯は無料の場合あり）',
  '江東区役所または子ども家庭支援センターに申請',
  'https://www.city.koto.lg.jp/390101/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 4, NULL);

-- ============================================================
-- 江戸川区 (Edogawa-ku) 追加3件
-- ============================================================

-- 江戸川区 乳児養育手当（最重要：独自制度）
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '江戸川区', '江戸川区 乳児養育手当', '給付金・手当',
  '0歳（1歳未満）の乳児を在宅で養育している保護者に月13,000円を支給',
  '江戸川区独自の子育て支援手当。1歳未満の乳児を認可保育所・認定こども園等に入所させず在宅で養育している保護者に、月13,000円を支給する。所得制限あり（扶養義務者の前年所得が一定以下）。江戸川区の手厚い子育て支援の代表的な制度。',
  13000, NULL,
  '月13,000円（最長11ヶ月間）= 年間最大143,000円の支給',
  '江戸川区役所子育て支援課に出生後速やかに申請（認可保育所等に入所していないことが条件）',
  'https://www.city.edogawa.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 11, 700);

-- ---

-- 江戸川区 私立幼稚園就園奨励費補助
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '江戸川区', '江戸川区 私立幼稚園就園奨励費補助', '保育・教育',
  '私立幼稚園等に通う3〜5歳の保育料を区が補助',
  '江戸川区では国の幼児教育無償化に加えて、江戸川区独自の上乗せ補助を実施。私立幼稚園・認定こども園（幼稚園型）等に通う3〜5歳の子どもを対象に、保育料の一部を補助する。',
  NULL, NULL,
  '国の無償化に加え、江戸川区が独自に上乗せ補助',
  '在籍する幼稚園等を通じて申請（毎年度更新）',
  'https://www.city.edogawa.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 36, 71, NULL);

-- ---

-- 江戸川区 電動アシスト自転車等購入費補助
INSERT INTO policies (layer, ward, name, category, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '江戸川区', '江戸川区 電動アシスト自転車等購入費補助', '物品・生活支援',
  '子育て世帯が電動アシスト自転車を購入する際に購入費の1/2（上限2万円）を補助',
  '江戸川区では18歳未満の子どもがいる世帯（子育て世帯）を対象に、電動アシスト付自転車の購入費の一部を補助。チャイルドシート付きや3人乗り対応のものも対象。子育て世帯の安全な移動手段確保を目的とした江戸川区独自の支援策。',
  NULL, 20000,
  '購入費の1/2補助（上限20,000円）先着順。年度ごとに予算が設定されるため早めに申請を',
  '江戸川区役所子育て支援課の窓口に購入前に申請',
  'https://www.city.edogawa.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 215, NULL);

END $$;
