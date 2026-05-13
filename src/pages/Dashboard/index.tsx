import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Gauge,
  HardHat,
  Map,
  RefreshCw,
  Timer,
  Wrench,
} from "lucide-react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { getDashboardSummary } from "../../services/dashboardService";
import type { DashboardSummary } from "../../types/dashboard";
import styles from "./styles.module.css";

type CardTone = "default" | "warning" | "danger" | "success" | "primary";

type DashboardCard = {
  title: string;
  value: number | string;
  description: string;
  tone: CardTone;
  icon: React.ElementType;
};

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0h";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}min`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}

export function Dashboard() {
  const { currentWorkspace } = useWorkspace();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDashboard() {
    if (!currentWorkspace) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await getDashboardSummary(currentWorkspace.workspace_id);
      setSummary(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar dashboard.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [currentWorkspace?.workspace_id]);

  const cards = useMemo<DashboardCard[]>(() => {
    const data = summary;

    return [
      {
        title: "Chamados novos",
        value: data?.new_service_requests_count ?? 0,
        description: "Solicitações recém-abertas aguardando análise.",
        tone: "primary",
        icon: ClipboardList,
      },
      {
        title: "Em triagem",
        value: data?.in_triage_service_requests_count ?? 0,
        description: "Chamados em análise antes de virar OS.",
        tone: "default",
        icon: Gauge,
      },
      {
        title: "OS abertas",
        value: data?.open_work_orders_count ?? 0,
        description: "Ordens ainda não encerradas ou canceladas.",
        tone: "default",
        icon: Wrench,
      },
      {
        title: "Em execução",
        value: data?.in_execution_work_orders_count ?? 0,
        description: "Ordens com execução técnica em andamento.",
        tone: "success",
        icon: HardHat,
      },
      {
        title: "OS atrasadas",
        value: data?.overdue_work_orders_count ?? 0,
        description: "Ordens abertas que passaram do prazo calculado.",
        tone: "danger",
        icon: AlertTriangle,
      },
      {
        title: "Aguardando validação",
        value: data?.waiting_validation_work_orders_count ?? 0,
        description: "Serviços finalizados aguardando aceite.",
        tone: "warning",
        icon: CheckCircle2,
      },
      {
        title: "Preventivas a gerar",
        value: data?.preventive_ready_to_generate_count ?? 0,
        description: "Ocorrências preventivas dentro da janela de geração.",
        tone: "warning",
        icon: CalendarClock,
      },
      {
        title: "Preventivas 7 dias",
        value: data?.preventive_due_next_7_days_count ?? 0,
        description: "Preventivas com vencimento nos próximos 7 dias.",
        tone: "default",
        icon: Clock,
      },
      {
        title: "Ativos ativos",
        value: data?.active_assets_count ?? 0,
        description: "Locais, sistemas, equipamentos e componentes ativos.",
        tone: "primary",
        icon: Map,
      },
      {
        title: "Horas no mês",
        value: formatMinutes(data?.labor_minutes_current_month ?? 0),
        description: "Total de horas apontadas no mês atual.",
        tone: "default",
        icon: Timer,
      },
    ];
  }, [summary]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Dashboard operacional</span>
          <h1>{currentWorkspace?.workspace_name}</h1>
          <p>
            Visão inicial dos chamados, ordens de serviço, preventivas, ativos e
            horas apontadas no workspace atual.
          </p>
        </div>

        <button type="button" onClick={loadDashboard} disabled={loading}>
          <RefreshCw size={16} />
          Atualizar
        </button>
      </header>

      {errorMessage && (
        <div className={styles.errorBox}>
          <strong>Erro ao carregar dashboard</strong>
          <span>{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingBox}>Carregando indicadores...</div>
      ) : (
        <>
          <section className={styles.grid}>
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className={`${styles.card} ${styles[card.tone]}`}
                >
                  <div className={styles.cardIcon}>
                    <Icon size={20} />
                  </div>

                  <div>
                    <span>{card.title}</span>
                    <strong>{card.value}</strong>
                    <p>{card.description}</p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className={styles.panel}>
            <div>
              <span className={styles.panelLabel}>Status da integração</span>
              <h2>Front conectado ao Supabase</h2>
              <p>
                Se estes cards carregaram com dados reais, então a autenticação,
                o workspace ativo, a view <strong>v_dashboard_summary</strong> e
                as políticas de RLS estão funcionando no fluxo principal.
              </p>
            </div>

            <div className={styles.panelInfo}>
              <span>Workspace ID</span>
              <strong>{currentWorkspace?.workspace_id}</strong>
            </div>
          </section>
        </>
      )}
    </div>
  );
}