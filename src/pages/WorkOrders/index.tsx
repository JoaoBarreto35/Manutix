import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  ListChecks,
  PlayCircle,
  RefreshCw,
  Search,
  Send,
  UserRound,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import {
  addWorkOrderTask,
  getWorkOrders,
  planWorkOrder,
  releaseWorkOrder,
} from "../../services/workOrderService";
import type {
  MaintenanceType,
  PriorityLevel,
  TaskResponseType,
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

const responseTypeLabels: Record<TaskResponseType, string> = {
  checkbox: "Checkbox",
  text: "Texto",
  number: "Número",
  boolean: "Sim/Não",
  compliance: "Conformidade",
  photo: "Foto",
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

  const [selectedTaskWorkOrder, setSelectedTaskWorkOrder] =
    useState<WorkOrderListItem | null>(null);

  const [selectedReleaseWorkOrder, setSelectedReleaseWorkOrder] =
    useState<WorkOrderListItem | null>(null);

  const [scheduledStartAt, setScheduledStartAt] = useState(getDefaultStartDateTime());
  const [scheduledEndAt, setScheduledEndAt] = useState(getDefaultEndDateTime());
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(120);
  const [planningNote, setPlanningNote] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskResponseType, setTaskResponseType] =
    useState<TaskResponseType>("checkbox");
  const [taskIsRequired, setTaskIsRequired] = useState(true);
  const [taskRequiresPhoto, setTaskRequiresPhoto] = useState(false);

  const [releaseReason, setReleaseReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [releasing, setReleasing] = useState(false);
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
    setSelectedTaskWorkOrder(null);
    setSelectedReleaseWorkOrder(null);

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

  function openTaskPanel(workOrder: WorkOrderListItem) {
    setSelectedTaskWorkOrder(workOrder);
    setSelectedWorkOrder(null);
    setSelectedReleaseWorkOrder(null);

    setTaskTitle("");
    setTaskDescription("");
    setTaskResponseType("checkbox");
    setTaskIsRequired(true);
    setTaskRequiresPhoto(false);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeTaskPanel() {
    setSelectedTaskWorkOrder(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskResponseType("checkbox");
    setTaskIsRequired(true);
    setTaskRequiresPhoto(false);
  }

  function openReleasePanel(workOrder: WorkOrderListItem) {
    setSelectedReleaseWorkOrder(workOrder);
    setSelectedWorkOrder(null);
    setSelectedTaskWorkOrder(null);

    setReleaseReason("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeReleasePanel() {
    setSelectedReleaseWorkOrder(null);
    setReleaseReason("");
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

  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTaskWorkOrder) return;

    setAddingTask(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await addWorkOrderTask({
        workOrderId: selectedTaskWorkOrder.id,
        title: taskTitle,
        description: taskDescription.trim() || null,
        responseType: taskResponseType,
        isRequired: taskIsRequired,
        requiresPhoto: taskRequiresPhoto,
        sortOrder: selectedTaskWorkOrder.tasks_count + 1,
      });

      setSuccessMessage("Subtarefa adicionada com sucesso.");
      closeTaskPanel();

      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao adicionar subtarefa.";

      setErrorMessage(message);
    } finally {
      setAddingTask(false);
    }
  }

  async function handleReleaseWorkOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedReleaseWorkOrder) return;

    if (selectedReleaseWorkOrder.status !== "planned") {
      setErrorMessage("Apenas OS planejadas podem ser liberadas.");
      return;
    }

    setReleasing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await releaseWorkOrder({
        workOrderId: selectedReleaseWorkOrder.id,
        reason: releaseReason.trim() || null,
      });

      setSuccessMessage("OS liberada para execução com sucesso.");
      closeReleasePanel();

      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao liberar OS.";

      setErrorMessage(message);
    } finally {
      setReleasing(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Execução operacional</span>
          <h1>Ordens de Serviço</h1>
          <p>
            Liste, filtre, planeje, crie subtarefas e libere ordens de serviço
            do workspace <strong>{currentWorkspace?.workspace_name}</strong>.
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

      {selectedTaskWorkOrder && (
        <section className={styles.formCard}>
          <div className={styles.formHeader}>
            <div>
              <span>Checklist</span>
              <h2>Adicionar subtarefa</h2>
              <p>
                OS {selectedTaskWorkOrder.work_order_code} ·{" "}
                {selectedTaskWorkOrder.asset_code} -{" "}
                {selectedTaskWorkOrder.asset_name}
              </p>
            </div>
          </div>

          <form onSubmit={handleAddTask} className={styles.form}>
            <label className={styles.fullField}>
              Título da subtarefa
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Ex: Testar funcionamento após reparo"
                required
              />
            </label>

            <label>
              Tipo de resposta
              <select
                value={taskResponseType}
                onChange={(event) =>
                  setTaskResponseType(event.target.value as TaskResponseType)
                }
              >
                <option value="checkbox">Checkbox</option>
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="boolean">Sim/Não</option>
                <option value="compliance">Conformidade</option>
                <option value="photo">Foto</option>
              </select>
            </label>

            <label>
              Obrigatória?
              <select
                value={taskIsRequired ? "yes" : "no"}
                onChange={(event) => setTaskIsRequired(event.target.value === "yes")}
              >
                <option value="yes">Sim</option>
                <option value="no">Não</option>
              </select>
            </label>

            <label>
              Exige foto?
              <select
                value={taskRequiresPhoto ? "yes" : "no"}
                onChange={(event) =>
                  setTaskRequiresPhoto(event.target.value === "yes")
                }
              >
                <option value="no">Não</option>
                <option value="yes">Sim</option>
              </select>
            </label>

            <label className={styles.fullField}>
              Descrição
              <textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                rows={3}
                placeholder="Detalhe como a subtarefa deve ser verificada."
              />
            </label>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeTaskPanel}
              >
                Cancelar
              </button>

              <button type="submit" className={styles.primaryButton} disabled={addingTask}>
                <ListChecks size={16} />
                {addingTask ? "Adicionando..." : "Adicionar subtarefa"}
              </button>
            </div>
          </form>
        </section>
      )}

      {selectedReleaseWorkOrder && (
        <section className={styles.formCard}>
          <div className={styles.formHeader}>
            <div>
              <span>Liberação</span>
              <h2>Liberar OS {selectedReleaseWorkOrder.work_order_code}</h2>
              <p>
                Após liberar, a ordem ficará disponível para início da execução
                técnica.
              </p>
            </div>
          </div>

          <form onSubmit={handleReleaseWorkOrder} className={styles.form}>
            <label className={styles.fullField}>
              Observação da liberação
              <textarea
                value={releaseReason}
                onChange={(event) => setReleaseReason(event.target.value)}
                rows={3}
                placeholder="Ex: OS liberada conforme programação aprovada."
              />
            </label>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeReleasePanel}
              >
                Cancelar
              </button>

              <button type="submit" className={styles.primaryButton} disabled={releasing}>
                <Send size={16} />
                {releasing ? "Liberando..." : "Liberar para execução"}
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

                  {(order.status === "waiting_planning" ||
                    order.status === "planned") && (
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => openTaskPanel(order)}
                      >
                        <ListChecks size={16} />
                        Subtarefa
                      </button>
                    )}

                  {order.status === "planned" && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => openReleasePanel(order)}
                    >
                      <Send size={16} />
                      Liberar
                    </button>
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