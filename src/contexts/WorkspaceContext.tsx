import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { getMyWorkspaces } from "../services/workspaceService";
import type { MyWorkspace } from "../types/workspace";

type WorkspaceContextValue = {
  workspaces: MyWorkspace[];
  currentWorkspace: MyWorkspace | null;
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
  setCurrentWorkspaceById: (workspaceId: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

type WorkspaceProviderProps = {
  children: ReactNode;
};

const STORAGE_KEY = "manutix_current_workspace_id";

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const { user } = useAuth();

  const [workspaces, setWorkspaces] = useState<MyWorkspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<MyWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const result = await getMyWorkspaces();

      setWorkspaces(result);

      const savedWorkspaceId = localStorage.getItem(STORAGE_KEY);
      const savedWorkspace = result.find(
        (workspace) => workspace.workspace_id === savedWorkspaceId
      );

      const nextWorkspace = savedWorkspace ?? result[0] ?? null;

      setCurrentWorkspace(nextWorkspace);

      if (nextWorkspace) {
        localStorage.setItem(STORAGE_KEY, nextWorkspace.workspace_id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWorkspaces().catch((error: unknown) => {
      console.error("Erro ao carregar workspaces:", error);
      setLoading(false);
    });
  }, [refreshWorkspaces]);

  function setCurrentWorkspaceById(workspaceId: string) {
    const workspace = workspaces.find((item) => item.workspace_id === workspaceId);

    if (!workspace) return;

    setCurrentWorkspace(workspace);
    localStorage.setItem(STORAGE_KEY, workspace.workspace_id);
  }

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      currentWorkspace,
      loading,
      refreshWorkspaces,
      setCurrentWorkspaceById,
    }),
    [workspaces, currentWorkspace, loading, refreshWorkspaces]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace deve ser usado dentro de WorkspaceProvider");
  }

  return context;
}