export type ServiceRequestStatus =
  | "new"
  | "in_triage"
  | "waiting_information"
  | "converted_to_work_order"
  | "duplicated"
  | "out_of_scope"
  | "rejected"
  | "cancelled";

export type ServiceRequestSource =
  | "client_portal"
  | "internal"
  | "whatsapp"
  | "email"
  | "phone"
  | "other";

export type MaintenanceType =
  | "corrective"
  | "preventive"
  | "inspection"
  | "improvement"
  | "emergency";

export type PriorityLevel = "low" | "medium" | "high" | "critical";

export type AssetTypeProblem = {
  id: string;
  workspace_id: string;
  asset_type_id: string;
  name: string;
  description: string | null;
  suggested_priority: PriorityLevel;
  suggested_maintenance_type: MaintenanceType;
  requires_photo: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceRequestListItem = {
  id: string;
  workspace_id: string;
  request_number: number;
  request_code: string;
  source: ServiceRequestSource;
  status: ServiceRequestStatus;

  opened_by: string;
  opened_by_name: string | null;
  opened_by_email: string | null;

  asset_id: string;
  asset_code: string;
  asset_name: string;
  asset_kind: string;
  asset_criticality: string;

  asset_type_id: string;
  asset_type_name: string;

  standard_problem_id: string | null;
  problem_label_snapshot: string | null;
  problem_other_text: string | null;

  title: string;
  description: string;

  suggested_priority: PriorityLevel;
  suggested_maintenance_type: MaintenanceType;

  triaged_by: string | null;
  triaged_by_name: string | null;
  triaged_at: string | null;

  duplicated_of_request_id: string | null;

  rejection_reason: string | null;
  out_of_scope_reason: string | null;
  cancellation_reason: string | null;

  converted_at: string | null;

  attachments_count: number;
  comments_count: number;

  created_at: string;
  updated_at: string;
};

export type CreateServiceRequestInput = {
  workspaceId: string;
  assetId: string;
  standardProblemId: string | null;
  problemOtherText: string | null;
  title: string;
  description: string;
  source: ServiceRequestSource;
};