import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { Assets } from "../pages/Assets";
import { Dashboard } from "../pages/Dashboard";
import { Login } from "../pages/Login";
import { ServiceRequests } from "../pages/ServiceRequests";
import { SetupWorkspace } from "../pages/SetupWorkspace";
import { ProtectedRoute } from "./ProtectedRoute";

function WorkspaceGate() {
  const { currentWorkspace, loading } = useWorkspace();

  if (loading) {
    return <div className="screen-center">Carregando workspace...</div>;
  }

  if (!currentWorkspace) {
    return <SetupWorkspace />;
  }

  return <AppShell />;
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="page-placeholder">
      <span>Em construção</span>
      <h1>{title}</h1>
      <p>Esta tela será implementada nas próximas fases do Manutix.</p>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<WorkspaceGate />}>
          <Route index element={<Dashboard />} />
          <Route path="/ativos" element={<Assets />} />
          <Route path="/chamados" element={<ServiceRequests />} />
          <Route path="/ordens" element={<PlaceholderPage title="Ordens de Serviço" />} />
          <Route
            path="/configuracoes"
            element={<PlaceholderPage title="Configurações" />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}