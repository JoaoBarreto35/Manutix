export type WorkspaceRole =
  | "admin"
  | "manager"
  | "planner"
  | "technician"
  | "client";

export type MyWorkspace = {
  workspace_id: string;
  workspace_name: string;
  workspace_description: string | null;
  workspace_status: string;
  organization_id: string;
  organization_name: string;
  workspace_role: WorkspaceRole;
  member_status: string;
  workspace_created_at: string;
};