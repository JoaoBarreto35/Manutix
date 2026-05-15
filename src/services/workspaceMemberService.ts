import { supabase } from "../lib/supabase";

export type WorkspaceRole =
  | "admin"
  | "manager"
  | "planner"
  | "technician"
  | "client";

export type WorkspaceOperationalMember = {
  userId: string;
  fullName: string | null;
  email: string | null;
  role: WorkspaceRole;
};

type ProfileRelation = {
  full_name: string | null;
  email: string | null;
};

type WorkspaceMemberRow = {
  user_id: string;
  role: WorkspaceRole;
  profiles: ProfileRelation | ProfileRelation[] | null;
};

const operationalRoles: WorkspaceRole[] = [
  "admin",
  "manager",
  "planner",
  "technician",
];

function getProfileFromRelation(
  relation: ProfileRelation | ProfileRelation[] | null
): ProfileRelation | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

export async function getWorkspaceOperationalMembers(
  workspaceId: string
): Promise<WorkspaceOperationalMember[]> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id, role, profiles:user_id(full_name, email)")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .in("role", operationalRoles)
    .order("role", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as WorkspaceMemberRow[];

  return rows.map((row) => {
    const profile = getProfileFromRelation(row.profiles);

    return {
      userId: row.user_id,
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      role: row.role,
    };
  });
}
