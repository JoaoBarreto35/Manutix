import { supabase } from "../lib/supabase";
import type { AssetTypeProblem } from "../types/serviceRequest";
import type {
  CreateServiceRequestInput,
  ServiceRequestListItem,
  ServiceRequestStatus,
} from "../types/serviceRequest";

type GetServiceRequestsFilters = {
  workspaceId: string;
  search?: string;
  status?: ServiceRequestStatus | "all";
};

export async function getServiceRequests(
  filters: GetServiceRequestsFilters
): Promise<ServiceRequestListItem[]> {
  let query = supabase
    .from("v_service_requests_list")
    .select("*")
    .eq("workspace_id", filters.workspaceId)
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.search && filters.search.trim().length > 0) {
    const search = filters.search.trim();

    query = query.or(
      `request_code.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%,asset_name.ilike.%${search}%,asset_code.ilike.%${search}%,problem_label_snapshot.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ServiceRequestListItem[];
}

export async function getProblemsByAssetType(params: {
  workspaceId: string;
  assetTypeId: string;
}): Promise<AssetTypeProblem[]> {
  const { data, error } = await supabase
    .from("asset_type_problems")
    .select("*")
    .eq("workspace_id", params.workspaceId)
    .eq("asset_type_id", params.assetTypeId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AssetTypeProblem[];
}

export async function createServiceRequest(
  input: CreateServiceRequestInput
): Promise<string> {
  const { data, error } = await supabase.rpc("create_service_request", {
    target_workspace_id: input.workspaceId,
    target_asset_id: input.assetId,
    target_standard_problem_id: input.standardProblemId,
    target_problem_other_text: input.problemOtherText,
    target_title: input.title,
    target_description: input.description,
    target_source: input.source,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Não foi possível criar o chamado.");
  }

  return data as string;
}