import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  PlayCircle,
  RefreshCw,
  Search,
  UserRound,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { getWorkOrders, planWorkOrder } from "../../services/workOrderService";
import type {
  MaintenanceType,
  PriorityLevel,
  WorkOrderListItem,
  WorkOrderStatus,
} from "../../types/workOrder";
import styles from "./styles.module.css";

type StatusFilter = WorkOrderStatus | "all";

const statusLabels: Record<WorkOrderStatus, string> = {
  waiting_planning: "Aguardando planejamento",
  planned: "Planejada",
  released: "Liberada",
  in_execution: "Em execução",
  paused: "Pausada",
  waiting_validation: "Aguardando validação",
  rejected_by_client: "Rejeitada pelo cliente",
  closed: "Fechada",
  cancelled: "Cancelada",
};

const priorityLabels: Record<PriorityLevel, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  corrective: "Corretiva",
  preventive: "Preventiva",
  inspection: "Inspeção",
  improvement: "Melhoria",
  emergency: "Emergência",
};

function formatDateTime(value: string | null): string {
  if (!value) return "Não definido";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDefaultStartDateTime(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);

  return date.toISOString().slice(0, 16);
}

function getDefaultEndDateTime(): string {
  const date = new Date();
  date.setHours(date.getHours() + 2);

  return date.toISOString().slice(0, 16);
}

function toIsoFromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

export function WorkOrders() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [selectedWorkOrder, setSelectedWorkOrder] =
    useState<WorkOrderListItem | null>(null);

  const [scheduledStartAt, setScheduledStartAt] = useState(getDefaultStartDateTime());
  const [scheduledEndAt, setScheduledEndAt] = useState(getDefaultEndDateTime());
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(120);
  const [planningNote, setPlanningNote] = useState("");

  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canPlanSelectedOrder = useMemo(() => {
    return selectedWorkOrder?.status === "waiting_planning";
  }, [selectedWorkOrder]);

  async function loadData() {
    if (!currentWorkspace) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await getWorkOrders({
        workspaceId: currentWorkspace.workspace_id,
        search,
        status: statusFilter,
      });

      setWorkOrders(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar ordens.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentWorkspace?.workspace_id, statusFilter]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadData();
  }

  function openPlanningPanel(workOrder: WorkOrderListItem) {
    setSelectedWorkOrder(workOrder);
    setScheduledStartAt(getDefaultStartDateTime());
    setScheduledEndAt(getDefaultEndDateTime());
    setEstimatedDurationMinutes(workOrder.estimated_duration_minutes ?? 120);
    setPlanningNote("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closePlanningPanel() {
    setSelectedWorkOrder(null);
    setScheduledStartAt(getDefaultStartDateTime());
    setScheduledEndAt(getDefaultEndDateTime());
    setEstimatedDurationMinutes(120);
    setPlanningNote("");
  }

  async function handlePlanWorkOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedWorkOrder || !user) return;

    if (!canPlanSelectedOrder) {
      setErrorMessage("Apenas OS aguardando planejamento podem ser planejadas.");
      return;
    }

    if (new Date(scheduledEndAt) <= new Date(scheduledStartAt)) {
      setErrorMessage("A data final precisa ser maior que a data inicial.");
      return;
    }

    setPlanning(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await planWorkOrder({
        workOrderId: selectedWorkOrder.id,
        primaryUserId: user.id,
        supportUserIds: [],
        scheduledStartAt: toIsoFromLocalInput(scheduledStartAt),
        scheduledEndAt: toIsoFromLocalInput(scheduledEndAt),
        estimatedDurationMinutes,
        note: planningNote.trim() || null,
      });

      setSuccessMessage("OS planejada com sucesso.");
      closePlanningPanel();

      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao planejar OS.";

      setErrorMessage(message);
    } finally {
      setPlanning(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Execução operacional</span>
          <h1>Ordens de Serviço</h1>
          <p>
            Liste, filtre e planeje ordens de serviço do workspace{" "}
            <strong>{currentWorkspace?.workspace_name}</strong>.
          </p>
        </div>

        <button type="button" className={styles.secondaryButton} onClick={loadData}>
          <RefreshCw size={16} />
          Atualizar
        </button>
      </header>

      {errorMessage && (
        <div className={styles.errorBox}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className={styles.successBox}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {selectedWorkOrder && (
        <section className={styles.formCard}>
          <div className={styles.formHeader}>
            <div>
              <span>Planejamento</span>
              <h2>Planejar OS {selectedWorkOrder.work_order_code}</h2>
              <p>
                {selectedWorkOrder.asset_code} - {selectedWorkOrder.asset_name}
              </p>
            </div>
          </div>

          <form onSubmit={handlePlanWorkOrder} className={styles.form}>
            <label>
              Responsável principal
              <input value={user?.email ?? "Usuário logado"} disabled />
            </label>

            <label>
              Início programado
              <input
                type="datetime-local"
                value={scheduledStartAt}
                onChange={(event) => setScheduledStartAt(event.target.value)}
                required
              />
            </label>

            <label>
              Fim programado
              <input
                type="datetime-local"
                value={scheduledEndAt}
                onChange={(event) => setScheduledEndAt(event.target.value)}
                required
              />
            </label>

            <label>
              Duração estimada em minutos
              <input
                type="number"
                min={1}
                value={estimatedDurationMinutes}
                onChange={(event) =>
                  setEstimatedDurationMinutes(Number(event.target.value))
                }
                required
              />
            </label>

            <label className={styles.fullField}>
              Observação do planejamento
              <textarea
                value={planningNote}
                onChange={(event) => setPlanningNote(event.target.value)}
                rows={3}
                placeholder="Ex: Programado para inspeção no início do turno."
              />
            </label>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closePlanningPanel}
              >
                Cancelar
              </button>

              <button type="submit" className={styles.primaryButton} disabled={planning}>
                <CalendarClock size={16} />
                {planning ? "Planejando..." : "Salvar planejamento"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.filters}>
        <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por OS, título, descrição, ativo ou chamado..."
          />
          <button type="submit">Buscar</button>
        </form>

        <div className={styles.filterGroup}>
          <Filter size={16} />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">Todos os status</option>
            <option value="waiting_planning">Aguardando planejamento</option>
            <option value="planned">Planejadas</option>
            <option value="released">Liberadas</option>
            <option value="in_execution">Em execução</option>
            <option value="paused">Pausadas</option>
            <option value="waiting_validation">Aguardando validação</option>
            <option value="rejected_by_client">Rejeitadas pelo cliente</option>
            <option value="closed">Fechadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
      </section>

      <section className={styles.list}>
        {loading ? (
          <div className={styles.emptyState}>Carregando ordens...</div>
        ) : workOrders.length === 0 ? (
          <div className={styles.emptyState}>
            Nenhuma ordem encontrada para os filtros atuais.
          </div>
        ) : (
          workOrders.map((order) => (
            <article key={order.id} className={styles.orderCard}>
              <div className={styles.orderIcon}>
                <Wrench size={20} />
              </div>

              <div className={styles.orderMain}>
                <div className={styles.orderTop}>
                  <div>
                    <strong>{order.title}</strong>
                    <span>
                      {order.work_order_code} · Criada em{" "}
                      {formatDateTime(order.created_at)}
                    </span>
                  </div>

                  <div className={styles.badges}>
                    <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    <span className={`${styles.priorityBadge} ${styles[order.priority]}`}>
                      {priorityLabels[order.priority]}
                    </span>
                  </div>
                </div>

                <p>{order.description}</p>

                <div className={styles.meta}>
                  <span>
                    Ativo: {order.asset_code} - {order.asset_name}
                  </span>
                  <span>Tipo: {maintenanceTypeLabels[order.maintenance_type]}</span>
                  <span>Origem: {order.origin}</span>
                  <span>Prazo: {formatDateTime(order.calculated_due_at)}</span>
                  <span>
                    Programado: {formatDateTime(order.scheduled_start_at)}
                  </span>
                  <span>
                    Responsável: {order.primary_user_name || "Não definido"}
                  </span>
                  <span>Subtarefas: {order.tasks_count}</span>
                  <span>Horas: {Math.round(order.total_labor_minutes / 60)}h</span>
                </div>

                <div className={styles.cardActions}>
                  {order.status === "waiting_planning" && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => openPlanningPanel(order)}
                    >
                      <CalendarClock size={16} />
                      Planejar
                    </button>
                  )}

                  {order.status === "planned" && (
                    <span className={styles.infoPill}>
                      <Clock size={15} />
                      Pronta para liberação
                    </span>
                  )}

                  {order.status === "released" && (
                    <span className={styles.infoPill}>
                      <PlayCircle size={15} />
                      Liberada para execução
                    </span>
                  )}

                  {order.primary_user_id && (
                    <span className={styles.infoPill}>
                      <UserRound size={15} />
                      Responsável definido
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}