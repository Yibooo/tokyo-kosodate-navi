-- =============================================
-- Phase1 シードデータ: 既知の子育て支援制度
-- 国2件 / 東京都2件 / 5区×2件 = 14件
-- =============================================
DO $$
DECLARE pid UUID;
BEGIN

-- =============================================
-- 国 (National)
-- =============================================

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('national', NULL, '児童手当',
  '0歳から高校生まで毎月支給される国の給付金（所得制限なし）',
  '2024年10月から所得制限が完全撤廃され、高校生（18歳年度末）まで対象が拡充。第3子以降は月額30,000円に増額。',
  10000, NULL,
  '0〜2歳:月15,000円 / 3歳〜高校生:月10,000円 / 第3子以降:月30,000円',
  '出生後（または転入後）15日以内に居住区の区役所へ申請。マイナポータルからオンライン申請も可。',
  'https://www.cfa.go.jp/policies/kokoseido/jidouteate/', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 215, NULL);

-- ---

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('national', NULL, '出産育児一時金',
  '健康保険から出産時に一括50万円が支給される',
  '健康保険（または国民健康保険）加入者が対象。出産1件につき50万円が支給。直接支払制度を使うと病院に直接支払われるため窓口負担なし。産科医療補償制度未加入施設では488,000円。',
  NULL, 500000,
  '産科医療補償制度未加入施設での出産は488,000円',
  '直接支払制度（病院への直接支払）を利用するか、出産後に健康保険組合または区役所国保窓口へ申請',
  'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryouhoken/shussan/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 3, NULL);

-- =============================================
-- 東京都 (Tokyo)
-- =============================================

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('tokyo', NULL, '018サポート（東京都）',
  '0〜18歳の子ども1人あたり月5,000円（年6万円）を支給。所得制限なし',
  '東京都独自の給付金。0歳から18歳（18歳の誕生日が属する年度末まで）の子ども全員が対象。所得制限なし。4ヶ月ごとに15,000円（月5,000円相当）が振り込まれる。',
  5000, NULL, '年間60,000円（4ヶ月ごとに15,000円振込）',
  '東京都の専用サイト（018support.metro.tokyo.lg.jp）からオンライン申請',
  'https://018support.metro.tokyo.lg.jp/', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 215, NULL);

-- ---

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('tokyo', NULL, '東京都 赤ちゃんファースト',
  '出産家庭に10万円相当のギフトカタログを贈呈',
  '都内在住で2023年4月1日以降に生まれた子どもがいる家庭が対象。育児用品・食料品・サービス等から選べる10万円相当のカタログギフト。',
  NULL, 100000, '10万円相当のカタログギフト（商品・サービスから選択）',
  '区市町村の窓口または専用サイトから申請（出生後申請）',
  'https://www.fukushi.metro.tokyo.lg.jp/kodomo/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 12, NULL);

-- =============================================
-- 港区 (Minato-ku)
-- =============================================

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '港区', '港区 子ども医療費助成',
  '中学校卒業まで医療費が無料（所得制限なし）',
  '港区では0歳から中学校卒業（15歳到達後の3月31日）まで、保険診療内の医療費（入院・通院）が実質無料。住民税非課税世帯は高校生まで対象。',
  NULL, NULL, '保険診療内の医療費（入院・通院）が実質0円',
  '出生届提出時または転入時に港区役所へ申請（医療証が発行される）',
  'https://www.city.minato.tokyo.jp/jidouiryou/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 179, NULL);

-- ---

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '港区', '港区 子育て支援商品券（バースデーサポート）',
  '就学前の子ども1人あたり毎年誕生月に3万円分の商品券を贈呈',
  '港区在住の就学前（0〜5歳）の子どもに、誕生月に区内で使える商品券3万円分を贈呈。毎年もらえるため、5年間で最大15万円分。',
  NULL, 30000, '就学前まで毎年誕生月に3万円分の商品券（5年間で最大15万円）',
  '港区役所窓口または郵送にて申請',
  'https://www.city.minato.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 71, NULL);

-- =============================================
-- 品川区 (Shinagawa-ku)
-- =============================================

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '品川区', '品川区 子ども医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '品川区では0歳から高校卒業（18歳到達後の3月31日）まで医療費（保険診療内）が無料。東京都の助成に品川区が独自に上乗せし、高校生まで拡大。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '転入時または出生届提出時に品川区役所へ申請',
  'https://www.city.shinagawa.tokyo.jp/PC/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 215, NULL);

-- ---

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '品川区', '品川区 出産祝金',
  '区内在住の子どもが生まれた家庭に出産祝金を支給',
  '品川区在住で出産した家庭に一時金を支給。第1子:1万円、第2子:2万円、第3子以降:10万円。',
  NULL, 10000, '第1子:10,000円 / 第2子:20,000円 / 第3子以降:100,000円',
  '出生届提出後、品川区役所窓口にて申請',
  'https://www.city.shinagawa.tokyo.jp/PC/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 6, NULL);

-- =============================================
-- 目黒区 (Meguro-ku)
-- =============================================

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '目黒区', '目黒区 子ども医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '目黒区では0歳から高校卒業（18歳到達後の3月31日）まで医療費（保険診療内の入院・通院）が無料。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '出生届提出時または転入時に目黒区役所へ申請',
  'https://www.city.meguro.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 215, NULL);

-- ---

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '目黒区', '目黒区 出産・子育て応援交付金',
  '妊娠届・出生届時に計10万円分のクーポンを支給',
  '国の「出産・子育て応援交付金」を目黒区が実施。妊娠届時に5万円分（伴走型相談支援）、出生後に5万円分（計10万円）のギフトカタログまたはクーポンを支給。',
  NULL, 100000, '妊娠届時5万円 ＋ 出生時5万円（合計10万円）',
  '妊娠届提出時に区役所で案内。出生後は別途申請が必要。',
  'https://www.city.meguro.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 6, NULL);

-- =============================================
-- 江東区 (Koto-ku)
-- =============================================

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '江東区', '江東区 子ども医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '江東区では0歳から高校卒業（18歳到達後の3月31日）まで医療費（保険診療内の入院・通院）が無料。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '出生届提出時または転入時に江東区役所へ申請',
  'https://www.city.koto.lg.jp/390101/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 215, NULL);

-- ---

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '江東区', '江東区 誕生祝品',
  '区内出生の子どもに誕生祝品（商品券等）を贈呈',
  '江東区在住で出生した子どもに誕生祝品として商品券等を贈呈。第3子以降は増額される。',
  NULL, 10000, '第3子以降は増額あり',
  '区役所窓口にて出生届と同時に申請',
  'https://www.city.koto.lg.jp/390101/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 3, NULL);

-- =============================================
-- 江戸川区 (Edogawa-ku)
-- =============================================

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '江戸川区', '江戸川区 子ども医療費助成',
  '高校生まで医療費が無料（所得制限なし）',
  '江戸川区では0歳から高校卒業（18歳到達後の3月31日）まで医療費（保険診療内の入院・通院）が無料。',
  NULL, NULL, '高校生まで保険診療内の医療費が0円',
  '出生届提出時または転入時に江戸川区役所へ申請',
  'https://www.city.edogawa.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 215, NULL);

-- ---

INSERT INTO policies (layer, ward, name, summary, description, amount_monthly, amount_lump, amount_note, apply_method, apply_url, status)
VALUES ('ward', '江戸川区', '江戸川区 こんにちは赤ちゃん事業（育児支援）',
  '生後4ヶ月以内の全家庭に保健師が訪問し育児グッズを贈呈',
  '江戸川区では生後4ヶ月以内の赤ちゃんがいる全家庭を保健師・助産師が訪問。育児相談に加え、おむつ等の育児支援グッズを現物で提供。申請不要。',
  NULL, NULL, '育児支援グッズ（おむつ等）の現物支給',
  '申請不要（区が自動的に訪問）',
  'https://www.city.edogawa.tokyo.jp/kosodate/index.html', 'approved')
RETURNING id INTO pid;
INSERT INTO policy_conditions (policy_id, child_age_min_months, child_age_max_months, income_max_man_yen)
VALUES (pid, 0, 4, NULL);

END $$;
