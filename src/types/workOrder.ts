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

export type TaskResponseType =
  | "checkbox"
  | "text"
  | "number"
  | "boolean"
  | "compliance"
  | "photo";

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

export type WorkOrderValidationResult = "approved" | "rejected";

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
  result: FinalResult | null;

  closed_by: string | null;
  closed_by_name: string | null;
  closed_at: string | null;

  primary_user_id: string | null;
  primary_user_name: string | null;

  assigned_users_count: number;
  total_labor_minutes: number;
  tasks_count: number;
  pending_required_tasks_count: number;
  required_tasks_count: number;
  completed_required_tasks_count: number;
  required_tasks_progress_percent: number | null;
  attachments_count: number;
  open_time_logs_count: number;
  current_user_has_open_time_log: boolean;

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


export type UpdateWorkOrderDetailsInput = {
  workOrderId: string;
  title: string;
  description: string | null;
  priority: PriorityLevel;
  maintenanceType: MaintenanceType;
  reason: string | null;
};

export type AddWorkOrderTaskInput = {
  workOrderId: string;
  title: string;
  description: string | null;
  responseType: TaskResponseType;
  isRequired: boolean;
  requiresPhoto: boolean;
  sortOrder: number;
};

export type UpdateWorkOrderTaskInput = {
  taskId: string;
  title: string;
  description: string | null;
  responseType: TaskResponseType;
  isRequired: boolean;
  requiresPhoto: boolean;
  sortOrder: number;
  reason: string | null;
};

export type DeleteWorkOrderTaskInput = {
  taskId: string;
  reason: string | null;
};

export type ApplyStandardWorkOrderTasksInput = {
  workOrderId: string;
};

export type ReleaseWorkOrderInput = {
  workOrderId: string;
  reason: string | null;
};

export type ReopenRejectedWorkOrderInput = {
  workOrderId: string;
  reason: string;
};

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

export type MarkWorkOrderTaskNotApplicableInput = {
  taskId: string;
  reason: string;
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

export type ValidateWorkOrderInput = {
  workOrderId: string;
  validationResult: WorkOrderValidationResult;
  rejectionReason: string | null;
  comment: string | null;
};

export type WorkOrderReportAsset = {
  id: string;
  code: string;
  name: string;
  kind: string;
  criticality: string;
  type_name: string;
};

export type WorkOrderReportServiceRequest = {
  id: string;
  code: string;
  opened_by: string;
  opened_by_name: string | null;
  problem: string | null;
  problem_other_text: string | null;
  description: string;
  created_at: string;
};

export type WorkOrderReportPreventive = {
  plan_id: string;
  plan_name: string;
  task_id: string;
  task_name: string;
  occurrence_id: string;
  due_date: string;
  due_at: string;
};

export type WorkOrderReportAssignment = {
  assignment_id: string;
  user_id: string;
  user_name: string | null;
  role: string;
  is_primary: boolean;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  estimated_minutes: number | null;
  total_minutes: number;
};

export type WorkOrderReportTask = {
  id: string;
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
  completed_by_name: string | null;
  completed_at: string | null;
  sort_order: number;
};

export type WorkOrderReportAttachment = {
  id: string;
  attachment_type: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  description: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  created_at: string;
};

export type WorkOrderReportValidation = {
  id: string;
  validation_result: WorkOrderValidationResult;
  validation_type: string;
  validated_by: string;
  validated_by_name: string | null;
  rejection_reason: string | null;
  comment: string | null;
  created_at: string;
};

export type WorkOrderReportHistory = {
  id: string;
  action: string;
  old_value: unknown;
  new_value: unknown;
  performed_by: string | null;
  performed_by_name: string | null;
  reason: string | null;
  created_at: string;
};

export type WorkOrderReport = {
  id: string;
  workspace_id: string;
  work_order_code: string;
  status: WorkOrderStatus;
  origin: WorkOrderOrigin;

  title: string;
  description: string;
  maintenance_type: MaintenanceType;
  priority: PriorityLevel;

  calculated_due_at: string;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  actual_started_at: string | null;
  actual_finished_at: string | null;

  execution_description: string | null;
  identified_cause: string | null;
  solution_applied: string | null;
  result: FinalResult | null;
  materials_used: string | null;
  internal_notes: string | null;

  asset: WorkOrderReportAsset;
  service_request: WorkOrderReportServiceRequest | null;
  preventive: WorkOrderReportPreventive | null;

  assignments: WorkOrderReportAssignment[] | null;
  tasks: WorkOrderReportTask[] | null;
  attachments: WorkOrderReportAttachment[] | null;
  validations: WorkOrderReportValidation[] | null;
  history: WorkOrderReportHistory[] | null;

  total_labor_minutes: number;
  calendar_duration_minutes: number | null;
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