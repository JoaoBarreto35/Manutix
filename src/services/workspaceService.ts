import { supabase } from "../lib/supabase";
import type { MyWorkspace } from "../types/workspace";

type CreateOrganizationWithWorkspaceResponse = {
  organization_id: string;
  workspace_id: string;
};

export async function getMyWorkspaces(): Promise<MyWorkspace[]> {
  const { data, error } = await supabase
    .from("v_my_workspaces")
    .select("*")
    .order("workspace_created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as MyWorkspace[];
}

export async function createOrganizationWithWorkspace(params: {
  organizationName: string;
  workspaceName: string;
}): Promise<CreateOrganizationWithWorkspaceResponse> {
  const { data, error } = await supabase.rpc("create_organization_with_workspace", {
    organization_name: params.organizationName,
    workspace_name: params.workspaceName,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Não foi possível criar a organização e o workspace.");
  }

  return data[0] as CreateOrganizationWithWorkspaceResponse;
}