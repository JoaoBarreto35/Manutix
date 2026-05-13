import { supabase } from "../lib/supabase";
import type {
  AddWorkOrderTaskInput,
  CompleteWorkOrderTaskInput,
  FinishWorkOrderInput,
  FinishWorkOrderParticipationInput,
  PlanWorkOrderInput,
  ReleaseWorkOrderInput,
  StartWorkOrderParticipationInput,
  ValidateWorkOrderInput,
  WorkOrderListItem,
  WorkOrderReport,
  WorkOrderStatus,
  WorkOrderTask,
} from "../types/workOrder";

type GetWorkOrdersFilters = {
  workspaceId: string;
  search?: string;
  status?: WorkOrderStatus | "all";
};

export async function getWorkOrders(
  filters: GetWorkOrdersFilters
): Promise<WorkOrderListItem[]> {
  let query = supabase
    .from("v_work_orders_list")
    .select("*")
    .eq("workspace_id", filters.workspaceId)
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.search && filters.search.trim().length > 0) {
    const search = filters.search.trim();

    query = query.or(
      `work_order_code.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%,asset_name.ilike.%${search}%,asset_code.ilike.%${search}%,service_request_code.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WorkOrderListItem[];
}

export async function getWorkOrderTasks(
  workOrderId: string
): Promise<WorkOrderTask[]> {
  const { data, error } = await supabase
    .from("work_order_tasks")
    .select("*")
    .eq("work_order_id", workOrderId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as WorkOrderTask[];
}

export async function getWorkOrderReport(
  workOrderId: string
): Promise<WorkOrderReport | null> {
  const { data, error } = await supabase
    .from("v_work_order_report")
    .select("*")
    .eq("id", workOrderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as WorkOrderReport | null;
}

export async function planWorkOrder(input: PlanWorkOrderInput): Promise<void> {
  const { error } = await supabase.rpc("plan_work_order", {
    target_work_order_id: input.workOrderId,
    target_primary_user_id: input.primaryUserId,
    target_support_user_ids: input.supportUserIds,
    target_scheduled_start_at: input.scheduledStartAt,
    target_scheduled_end_at: input.scheduledEndAt,
    target_estimated_duration_minutes: input.estimatedDurationMinutes,
    target_reason: input.note,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function addWorkOrderTask(
  input: AddWorkOrderTaskInput
): Promise<string> {
  const { data, error } = await supabase.rpc("add_work_order_task", {
    target_work_order_id: input.workOrderId,
    target_title: input.title,
    target_description: input.description,
    target_response_type: input.responseType,
    target_is_required: input.isRequired,
    target_requires_photo: input.requiresPhoto,
    target_sort_order: input.sortOrder,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Não foi possível adicionar a subtarefa.");
  }

  return data as string;
}

export async function releaseWorkOrder(
  input: ReleaseWorkOrderInput
): Promise<void> {
  const { error } = await supabase.rpc("release_work_order", {
    target_work_order_id: input.workOrderId,
    target_reason: input.reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function startWorkOrderParticipation(
  input: StartWorkOrderParticipationInput
): Promise<void> {
  const { error } = await supabase.rpc("start_work_order_participation", {
    target_work_order_id: input.workOrderId,
    target_notes: input.reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function finishWorkOrderParticipation(
  input: FinishWorkOrderParticipationInput
): Promise<void> {
  const { error } = await supabase.rpc("finish_work_order_participation", {
    target_work_order_id: input.workOrderId,
    target_notes: input.reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function completeWorkOrderTask(
  input: CompleteWorkOrderTaskInput
): Promise<void> {
  const { error } = await supabase.rpc("complete_work_order_task", {
    target_task_id: input.taskId,
    target_answer_text: input.answerText,
    target_answer_number: input.answerNumber,
    target_answer_boolean: input.answerBoolean,
    target_compliance_result: input.complianceResult,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function finishWorkOrder(input: FinishWorkOrderInput): Promise<void> {
  const { error } = await supabase.rpc("finish_work_order", {
    target_work_order_id: input.workOrderId,
    target_execution_description: input.executionDescription,
    target_identified_cause: input.identifiedCause,
    target_solution_applied: input.solutionApplied,
    target_result: input.result,
    target_materials_used: input.materialsUsed,
    target_internal_notes: input.internalNotes,
    target_close_open_time_logs: true,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function validateWorkOrder(
  input: ValidateWorkOrderInput
): Promise<void> {
  const { error } = await supabase.rpc("validate_work_order", {
    target_work_order_id: input.workOrderId,
    target_validation_result: input.validationResult,
    target_rejection_reason: input.rejectionReason,
    target_comment: input.comment,
  });

  if (error) {
    throw new Error(error.message);
  }
}