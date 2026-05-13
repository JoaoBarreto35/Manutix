import { supabase } from "../lib/supabase";
import type { DashboardSummary } from "../types/dashboard";

export async function getDashboardSummary(
  workspaceId: string
): Promise<DashboardSummary | null> {
  const { data, error } = await supabase
    .from("v_dashboard_summary")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as DashboardSummary | null;
}