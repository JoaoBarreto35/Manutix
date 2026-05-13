export type DashboardSummary = {
  workspace_id: string;
  workspace_name: string;

  new_service_requests_count: number;
  in_triage_service_requests_count: number;
  waiting_information_service_requests_count: number;

  open_work_orders_count: number;
  in_execution_work_orders_count: number;
  overdue_work_orders_count: number;
  scheduled_late_work_orders_count: number;
  waiting_validation_work_orders_count: number;
  rejected_work_orders_count: number;
  scheduled_today_work_orders_count: number;

  preventive_ready_to_generate_count: number;
  overdue_preventive_occurrences_count: number;
  preventive_due_next_7_days_count: number;

  active_assets_count: number;

  labor_minutes_current_month: number;

  generated_at: string;
};