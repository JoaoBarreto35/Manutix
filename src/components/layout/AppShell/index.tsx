import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Gauge,
  LogOut,
  Map,
  Settings,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useWorkspace } from "../../../contexts/WorkspaceContext";
import styles from "./styles.module.css";

export function AppShell() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const {
    workspaces,
    currentWorkspace,
    setCurrentWorkspaceById,
    loading,
  } = useWorkspace();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  if (loading) {
    return <div className="screen-center">Carregando workspace...</div>;
  }

  if (!currentWorkspace) {
    return <Outlet />;
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.logo}>M</div>
          <div>
            <strong>Manutix</strong>
            <span>CMMS SaaS</span>
          </div>
        </div>

        <div className={styles.workspaceBox}>
          <label htmlFor="workspace">Workspace</label>

          <select
            id="workspace"
            value={currentWorkspace.workspace_id}
            onChange={(event) => setCurrentWorkspaceById(event.target.value)}
          >
            {workspaces.map((workspace) => (
              <option
                key={workspace.workspace_id}
                value={workspace.workspace_id}
              >
                {workspace.workspace_name}
              </option>
            ))}
          </select>

          <small>{currentWorkspace.workspace_role}</small>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/" end>
            <Gauge size={18} />
            Dashboard
          </NavLink>

          <NavLink to="/ativos">
            <Map size={18} />
            Ativos
          </NavLink>

          <NavLink to="/chamados">
            <ClipboardList size={18} />
            Chamados
          </NavLink>

          <NavLink to="/ordens">
            <Wrench size={18} />
            Ordens
          </NavLink>

          <NavLink to="/configuracoes">
            <Settings size={18} />
            Configurações
          </NavLink>
        </nav>

        <div className={styles.userBox}>
          <span>{user?.email}</span>

          <button type="button" onClick={handleSignOut}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}