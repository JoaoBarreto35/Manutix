import { supabase } from "../lib/supabase";
import type {
  AssetKind,
  AssetListItem,
  AssetStatus,
  AssetType,
  CreateAssetInput,
} from "../types/asset";

type GetAssetsFilters = {
  workspaceId: string;
  search?: string;
  assetKind?: AssetKind | "all";
  status?: AssetStatus | "all";
};

export async function getAssetTypes(workspaceId: string): Promise<AssetType[]> {
  const { data, error } = await supabase
    .from("asset_types")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AssetType[];
}

export async function getAssets(
  filters: GetAssetsFilters
): Promise<AssetListItem[]> {
  let query = supabase
    .from("v_assets_list")
    .select("*")
    .eq("workspace_id", filters.workspaceId)
    .order("created_at", { ascending: false });

  if (filters.assetKind && filters.assetKind !== "all") {
    query = query.eq("asset_kind", filters.assetKind);
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.search && filters.search.trim().length > 0) {
    const search = filters.search.trim();

    query = query.or(
      `name.ilike.%${search}%,code.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AssetListItem[];
}

export async function createAsset(input: CreateAssetInput): Promise<void> {
  const { error } = await supabase.from("assets").insert({
    workspace_id: input.workspaceId,
    parent_id: input.parentId,
    asset_type_id: input.assetTypeId,
    asset_kind: input.assetKind,
    code: input.code,
    name: input.name,
    description: input.description,
    criticality: input.criticality,
  });

  if (error) {
    throw new Error(error.message);
  }
}