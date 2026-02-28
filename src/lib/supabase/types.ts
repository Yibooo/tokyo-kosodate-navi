export type PolicyLayer = 'national' | 'tokyo' | 'ward'
export type PolicyStatus = 'draft' | 'approved' | 'rejected' | 'archived'

export interface Policy {
  id: string
  layer: PolicyLayer
  ward: string | null
  name: string
  summary: string
  description: string | null
  amount_monthly: number | null
  amount_lump: number | null
  amount_note: string | null
  apply_method: string | null
  apply_url: string | null
  source_url: string | null
  valid_from: string | null
  valid_to: string | null
  status: PolicyStatus
  scraped_at: string | null
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
}

export interface PolicyCondition {
  id: string
  policy_id: string
  child_age_min_months: number | null
  child_age_max_months: number | null
  birth_order_min: number | null
  birth_order_max: number | null
  income_min_man_yen: number | null
  income_max_man_yen: number | null
  other_conditions: string | null
  created_at: string
}

export interface ScrapeLog {
  id: string
  target_url: string
  target_name: string
  layer: PolicyLayer
  ward: string | null
  status: string
  policies_found: number
  error_message: string | null
  started_at: string
  finished_at: string | null
}

// supabase-js の Database 型定義
export interface Database {
  public: {
    Tables: {
      policies: {
        Row: Policy
        Insert: Omit<Policy, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Policy, 'id' | 'created_at' | 'updated_at'>>
      }
      policy_conditions: {
        Row: PolicyCondition
        Insert: Omit<PolicyCondition, 'id' | 'created_at'>
        Update: Partial<Omit<PolicyCondition, 'id' | 'created_at'>>
      }
      scrape_logs: {
        Row: ScrapeLog
        Insert: Omit<ScrapeLog, 'id'>
        Update: Partial<Omit<ScrapeLog, 'id'>>
      }
    }
  }
}
