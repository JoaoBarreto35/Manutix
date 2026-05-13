export type AssetKind = "location" | "system" | "equipment" | "component";

export type AssetCriticality = "low" | "medium" | "high" | "critical";

export type AssetStatus = "active" | "inactive" | "archived";

export type AssetType = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AssetListItem = {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  parent_name: string | null;
  parent_code: string | null;

  asset_type_id: string;
  asset_type_name: string;

  asset_kind: AssetKind;
  code: string;
  name: string;
  description: string | null;
  criticality: AssetCriticality;
  status: AssetStatus;

  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;

  created_by: string | null;
  created_by_name: string | null;

  created_at: string;
  updated_at: string;
};

export type CreateAssetInput = {
  workspaceId: string;
  parentId: string | null;
  assetTypeId: string;
  assetKind: AssetKind;
  code: string;
  name: string;
  description: string | null;
  criticality: AssetCriticality;
};