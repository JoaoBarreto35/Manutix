import { supabase } from "../lib/supabase";
import type {
  PlanWorkOrderInput,
  WorkOrderListItem,
  WorkOrderStatus,
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