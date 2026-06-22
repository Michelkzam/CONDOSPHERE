import { createClient } from '../../utils/supabase/client';

// Initialize the type-safe browser client matching the @supabase/ssr helpers
export const supabase = createClient();

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          permissions: any;
          created_at: string;
        };
      };
      users: {
        Row: {
          id: string;
          full_name: string;
          username: string;
          email: string;
          profile_id: string | null;
          phone: string | null;
          cpf: string | null;
          is_active: boolean;
          created_at: string;
        };
      };
      residences: {
        Row: {
          id: string;
          identifier: string;
          owner: string;
          address: string;
          profile_name: string;
          base_value: number;
          status: string;
          created_at: string;
        };
      };
      residents: {
        Row: {
          id: string;
          name: string;
          cpf: string;
          contact: string;
          role: string;
          is_associated: boolean;
          is_resident: boolean;
          residence_name: string | null;
          created_at: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          plate: string;
          model: string;
          color: string;
          owner_name: string;
          is_active: boolean;
          created_at: string;
        };
      };
      common_areas: {
        Row: {
          id: string;
          name: string;
          capacity: number;
          cleaning_fee: number;
          status: string;
          created_at: string;
        };
      };
      reservations: {
        Row: {
          id: string;
          area_id: string | null;
          area_name: string;
          resident_name: string;
          date: string;
          time_period: string;
          fee: number;
          status: string;
          created_at: string;
        };
      };
      portaria_logs: {
        Row: {
          id: string;
          name: string;
          doc: string;
          type: string;
          vehicle_plate: string | null;
          authorized_by: string | null;
          action: string;
          photo_doc: string | null;
          photo_person: string | null;
          created_at: string;
        };
      };
      payables: {
        Row: {
          id: string;
          creditor: string;
          description: string;
          recurrence: string;
          due_date: string;
          category: string;
          value: number;
          status: string;
          payment_method: string | null;
          payment_date: string | null;
          notes: string | null;
          created_at: string;
        };
      };
      receivables: {
        Row: {
          id: string;
          identifier: string;
          owner_name: string;
          due_date: string;
          delay_days: number;
          base_value: number;
          extra_fees: number;
          agreed_discounts: number;
          status: string;
          cancellation_justification: string | null;
          charge_type: string;
          payment_method: string | null;
          payment_date: string | null;
          notes: string | null;
          reference_month: string | null;
          is_write_off: boolean;
          write_off_date: string | null;
          write_off_reason: string | null;
          created_at: string;
        };
      };
      financial_config: {
        Row: {
          id: string;
          fine_rate: number;
          interest_rate: number;
          discount_3m: number;
          discount_6m: number;
          discount_12m: number;
          due_day: number;
          late_fee_max_days: number;
          updated_at: string;
        };
      };
      payment_cancellations: {
        Row: {
          id: string;
          receivable_id: string;
          original_value: number;
          refund_value: number;
          cancellation_type: string;
          reason: string;
          refund_method: string | null;
          original_payment_method: string | null;
          original_payment_date: string | null;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
          executed_at: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
        };
      };
    };
  };
}
