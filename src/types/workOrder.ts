export type WorkOrderStatus =
  | "waiting_planning"
  | "planned"
  | "released"
  | "in_execution"
  | "paused"
  | "waiting_validation"
  | "rejected_by_client"
  | "closed"
  | "cancelled";

export type WorkOrderOrigin =
  | "service_request"
  | "internal"
  | "preventive_plan";

export type MaintenanceType =
  | "corrective"
  | "preventive"
  | "inspection"
  | "improvement"
  | "emergency";

export type PriorityLevel = "low" | "medium" | "high" | "critical";

export type WorkOrderListItem = {
  id: string;
  workspace_id: string;
  work_order_number: number;
  work_order_code: string;

  origin: WorkOrderOrigin;
  status: WorkOrderStatus;

  service_request_id: string | null;
  service_request_code: string | null;
  service_request_opened_by: string | null;
  service_request_opened_by_name: string | null;

  preventive_plan_id: string | null;
  preventive_plan_name: string | null;

  preventive_plan_task_id: string | null;
  preventive_plan_task_name: string | null;

  preventive_occurrence_id: string | null;
  preventive_due_date: string | null;

  created_by: string | null;
  created_by_name: string | null;

  asset_id: string;
  asset_code: string;
  asset_name: string;
  asset_kind: string;
  asset_criticality: string;

  asset_type_id: string;
  asset_type_name: string;

  title: string;
  description: string;

  maintenance_type: MaintenanceType;
  priority: PriorityLevel;

  calculated_due_at: string;
  due_calculated_at: string | null;
  due_source: string | null;

  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  estimated_duration_minutes: number | null;

  actual_started_at: string | null;
  actual_finished_at: string | null;

  execution_description: string | null;
  identified_cause: string | null;
  solution_applied: string | null;
  result: string | null;

  closed_by: string | null;
  closed_by_name: string | null;
  closed_at: string | null;

  primary_user_id: string | null;
  primary_user_name: string | null;

  assigned_users_count: number;
  total_labor_minutes: number;
  tasks_count: number;
  pending_required_tasks_count: number;
  attachments_count: number;

  schedule_health:
    | "completed_on_time"
    | "completed_late"
    | "overdue"
    | "unscheduled"
    | "scheduled_late"
    | "due_today"
    | "scheduled_on_time";

  created_at: string;
  updated_at: string;
};

export type PlanWorkOrderInput = {
  workOrderId: string;
  primaryUserId: string;
  supportUserIds: string[];
  scheduledStartAt: string;
  scheduledEndAt: string;
  estimatedDurationMinutes: number;
  note: string | null;
};

export type TaskResponseType =
  | "checkbox"
  | "text"
  | "number"
  | "boolean"
  | "compliance"
  | "photo";

export type AddWorkOrderTaskInput = {
  workOrderId: string;
  title: string;
  description: string | null;
  responseType: TaskResponseType;
  isRequired: boolean;
  requiresPhoto: boolean;
  sortOrder: number;
};

export type ReleaseWorkOrderInput = {
  workOrderId: string;
  reason: string | null;
};
export type WorkOrderTaskStatus =
  | "pending"
  | "completed"
  | "not_applicable";

export type FinalResult =
  | "resolved"
  | "partially_resolved"
  | "not_resolved"
  | "not_applicable"
  | "requires_new_work_order";

export type WorkOrderTask = {
  id: string;
  workspace_id: string;
  work_order_id: string;
  title: string;
  description: string | null;
  response_type: TaskResponseType;
  is_required: boolean;
  requires_photo: boolean;
  status: WorkOrderTaskStatus;
  answer_text: string | null;
  answer_number: number | null;
  answer_boolean: boolean | null;
  compliance_result: boolean | null;
  not_applicable_reason: string | null;
  completed_by: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type StartWorkOrderParticipationInput = {
  workOrderId: string;
  reason: string | null;
};

export type FinishWorkOrderParticipationInput = {
  workOrderId: string;
  reason: string | null;
};

export type CompleteWorkOrderTaskInput = {
  taskId: string;
  answerText: string | null;
  answerNumber: number | null;
  answerBoolean: boolean | null;
  complianceResult: boolean | null;
};

export type FinishWorkOrderInput = {
  workOrderId: string;
  executionDescription: string;
  identifiedCause: string;
  solutionApplied: string;
  result: FinalResult;
  materialsUsed: string | null;
  internalNotes: string | null;
  sendToValidation: boolean;
};

export type WorkOrderValidationResult = "approved" | "rejected";

export type ValidateWorkOrderInput = {
  workOrderId: string;
  validationResult: WorkOrderValidationResult;
  rejectionReason: string | null;
  comment: string | null;
};