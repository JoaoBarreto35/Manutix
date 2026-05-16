import { supabase } from "../lib/supabase";
import type {
  AddWorkOrderTaskInput,
  UpdateWorkOrderTaskInput,
  DeleteWorkOrderTaskInput,
  ApplyStandardWorkOrderTasksInput,
  CompleteWorkOrderTaskInput,
  FinishWorkOrderInput,
  FinishWorkOrderParticipationInput,
  MarkWorkOrderTaskNotApplicableInput,
  PlanWorkOrderInput,
  ReleaseWorkOrderInput,
  ReopenRejectedWorkOrderInput,
  StartWorkOrderParticipationInput,
  UpdateWorkOrderDetailsInput,
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

  const workOrders = (data ?? []) as WorkOrderListItem[];

  if (workOrders.length === 0) {
    return workOrders;
  }

  const { data: requiredTaskProgress, error: requiredTaskProgressError } =
    await supabase.rpc("get_work_order_required_task_progress", {
      target_workspace_id: filters.workspaceId,
    });

  if (requiredTaskProgressError) {
    throw new Error(requiredTaskProgressError.message);
  }

  const { data: executionState, error: executionStateError } =
    await supabase.rpc("get_work_order_execution_state", {
      target_workspace_id: filters.workspaceId,
    });

  if (executionStateError) {
    throw new Error(executionStateError.message);
  }

  const requiredTaskProgressByWorkOrder = new Map<
    string,
    {
      requiredTasksCount: number;
      completedRequiredTasksCount: number;
      requiredTasksProgressPercent: number;
    }
  >();

  for (const progress of requiredTaskProgress ?? []) {
    requiredTaskProgressByWorkOrder.set(String(progress.work_order_id), {
      requiredTasksCount: Number(progress.required_tasks_count ?? 0),
      completedRequiredTasksCount: Number(
        progress.completed_required_tasks_count ?? 0
      ),
      requiredTasksProgressPercent: Number(
        progress.required_tasks_progress_percent ?? 0
      ),
    });
  }

  const executionStateByWorkOrder = new Map<
    string,
    {
      openTimeLogsCount: number;
      currentUserHasOpenTimeLog: boolean;
    }
  >();

  for (const state of executionState ?? []) {
    executionStateByWorkOrder.set(String(state.work_order_id), {
      openTimeLogsCount: Number(state.open_time_logs_count ?? 0),
      currentUserHasOpenTimeLog: Boolean(state.current_user_has_open_time_log),
    });
  }

  return workOrders.map((workOrder) => {
    const progress = requiredTaskProgressByWorkOrder.get(workOrder.id) ?? {
      requiredTasksCount: 0,
      completedRequiredTasksCount: 0,
      requiredTasksProgressPercent: 0,
    };

    const state = executionStateByWorkOrder.get(workOrder.id) ?? {
      openTimeLogsCount: 0,
      currentUserHasOpenTimeLog: false,
    };

    return {
      ...workOrder,
      required_tasks_count: progress.requiredTasksCount,
      completed_required_tasks_count: progress.completedRequiredTasksCount,
      required_tasks_progress_percent: Math.max(
        0,
        Math.min(100, progress.requiredTasksProgressPercent)
      ),
      open_time_logs_count: state.openTimeLogsCount,
      current_user_has_open_time_log: state.currentUserHasOpenTimeLog,
    };
  });
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


export async function updateWorkOrderDetails(
  input: UpdateWorkOrderDetailsInput
): Promise<void> {
  const { error } = await supabase.rpc("update_work_order_details", {
    target_work_order_id: input.workOrderId,
    target_title: input.title,
    target_description: input.description,
    target_priority: input.priority,
    target_maintenance_type: input.maintenanceType,
    target_reason: input.reason,
  });

  if (error) {
    throw new Error(error.message);
  }
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

export async function updateWorkOrderTask(
  input: UpdateWorkOrderTaskInput
): Promise<void> {
  const { error } = await supabase.rpc("update_work_order_task", {
    target_task_id: input.taskId,
    target_title: input.title,
    target_description: input.description,
    target_response_type: input.responseType,
    target_is_required: input.isRequired,
    target_requires_photo: input.requiresPhoto,
    target_sort_order: input.sortOrder,
    target_reason: input.reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteWorkOrderTask(
  input: DeleteWorkOrderTaskInput
): Promise<void> {
  const { error } = await supabase.rpc("delete_work_order_task", {
    target_task_id: input.taskId,
    target_reason: input.reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function applyStandardWorkOrderTasks(
  input: ApplyStandardWorkOrderTasksInput
): Promise<number> {
  const { data, error } = await supabase.rpc("apply_standard_work_order_tasks", {
    target_work_order_id: input.workOrderId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Number(data ?? 0);
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

export async function reopenRejectedWorkOrder(
  input: ReopenRejectedWorkOrderInput
): Promise<void> {
  const { error } = await supabase.rpc("reopen_rejected_work_order", {
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

export async function markWorkOrderTaskNotApplicable(
  input: MarkWorkOrderTaskNotApplicableInput
): Promise<void> {
  const { error } = await supabase.rpc("mark_work_order_task_not_applicable", {
    target_task_id: input.taskId,
    target_reason: input.reason,
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