import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
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
  completeWorkOrderTask,
  finishWorkOrder,
  finishWorkOrderParticipation,
  getWorkOrderTasks,
  getWorkOrders,
  planWorkOrder,
  releaseWorkOrder,
  startWorkOrderParticipation,
  validateWorkOrder,
} from "../../services/workOrderService";
import type {
  FinalResult,
  MaintenanceType,
  PriorityLevel,
  TaskResponseType,
  WorkOrderListItem,
  WorkOrderStatus,
  WorkOrderTask,
  WorkOrderValidationResult,
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

const finalResultLabels: Record<FinalResult, string> = {
  resolved: "Resolvido",
  partially_resolved: "Parcialmente resolvido",
  not_resolved: "Não resolvido",
  not_applicable: "Não aplicável",
  requires_new_work_order: "Requer nova OS",
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

  const [selectedExecutionWorkOrder, setSelectedExecutionWorkOrder] =
    useState<WorkOrderListItem | null>(null);

  const [selectedValidationWorkOrder, setSelectedValidationWorkOrder] =
    useState<WorkOrderListItem | null>(null);

  const [executionTasks, setExecutionTasks] = useState<WorkOrderTask[]>([]);

  const [scheduledStartAt, setScheduledStartAt] = useState(
    getDefaultStartDateTime()
  );
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

  const [startReason, setStartReason] = useState("");
  const [finishParticipationReason, setFinishParticipationReason] =
    useState("");

  const [executionDescription, setExecutionDescription] = useState("");
  const [identifiedCause, setIdentifiedCause] = useState("");
  const [solutionApplied, setSolutionApplied] = useState("");
  const [finalResult, setFinalResult] = useState<FinalResult>("resolved");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [sendToValidation, setSendToValidation] = useState(true);

  const [validationResult, setValidationResult] =
    useState<WorkOrderValidationResult>("approved");
  const [validationComment, setValidationComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [startingExecution, setStartingExecution] = useState(false);
  const [finishingParticipation, setFinishingParticipation] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [finishingOrder, setFinishingOrder] = useState(false);
  const [validating, setValidating] = useState(false);

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

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeAllPanels() {
    setSelectedWorkOrder(null);
    setSelectedTaskWorkOrder(null);
    setSelectedReleaseWorkOrder(null);
    setSelectedExecutionWorkOrder(null);
    setSelectedValidationWorkOrder(null);
  }

  function openPlanningPanel(workOrder: WorkOrderListItem) {
    closeAllPanels();

    setSelectedWorkOrder(workOrder);
    setScheduledStartAt(getDefaultStartDateTime());
    setScheduledEndAt(getDefaultEndDateTime());
    setEstimatedDurationMinutes(workOrder.estimated_duration_minutes ?? 120);
    setPlanningNote("");

    clearMessages();
  }

  function closePlanningPanel() {
    setSelectedWorkOrder(null);
    setScheduledStartAt(getDefaultStartDateTime());
    setScheduledEndAt(getDefaultEndDateTime());
    setEstimatedDurationMinutes(120);
    setPlanningNote("");
  }

  function openTaskPanel(workOrder: WorkOrderListItem) {
    closeAllPanels();

    setSelectedTaskWorkOrder(workOrder);
    setTaskTitle("");
    setTaskDescription("");
    setTaskResponseType("checkbox");
    setTaskIsRequired(true);
    setTaskRequiresPhoto(false);

    clearMessages();
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
    closeAllPanels();

    setSelectedReleaseWorkOrder(workOrder);
    setReleaseReason("");

    clearMessages();
  }

  function closeReleasePanel() {
    setSelectedReleaseWorkOrder(null);
    setReleaseReason("");
  }

  async function openExecutionPanel(workOrder: WorkOrderListItem) {
    closeAllPanels();

    setSelectedExecutionWorkOrder(workOrder);
    setStartReason("");
    setFinishParticipationReason("");
    setExecutionDescription("");
    setIdentifiedCause("");
    setSolutionApplied("");
    setFinalResult("resolved");
    setMaterialsUsed("");
    setInternalNotes("");
    setSendToValidation(true);

    clearMessages();

    try {
      const tasks = await getWorkOrderTasks(workOrder.id);
      setExecutionTasks(tasks);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar subtarefas.";

      setErrorMessage(message);
      setExecutionTasks([]);
    }
  }

  function closeExecutionPanel() {
    setSelectedExecutionWorkOrder(null);
    setExecutionTasks([]);
    setStartReason("");
    setFinishParticipationReason("");
    setExecutionDescription("");
    setIdentifiedCause("");
    setSolutionApplied("");
    setFinalResult("resolved");
    setMaterialsUsed("");
    setInternalNotes("");
    setSendToValidation(true);
  }

  function openValidationPanel(workOrder: WorkOrderListItem) {
    closeAllPanels();

    setSelectedValidationWorkOrder(workOrder);
    setValidationResult("approved");
    setValidationComment("");
    setRejectionReason("");

    clearMessages();
  }

  function closeValidationPanel() {
    setSelectedValidationWorkOrder(null);
    setValidationResult("approved");
    setValidationComment("");
    setRejectionReason("");
  }

  async function refreshExecutionTasks() {
    if (!selectedExecutionWorkOrder) return;

    const tasks = await getWorkOrderTasks(selectedExecutionWorkOrder.id);
    setExecutionTasks(tasks);
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
    clearMessages();

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
    clearMessages();

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
    clearMessages();

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

  async function handleStartExecution() {
    if (!selectedExecutionWorkOrder) return;

    setStartingExecution(true);
    clearMessages();

    try {
      await startWorkOrderParticipation({
        workOrderId: selectedExecutionWorkOrder.id,
        reason: startReason.trim() || null,
      });

      setSuccessMessage("Execução iniciada com sucesso.");

      const updatedOrder: WorkOrderListItem = {
        ...selectedExecutionWorkOrder,
        status: "in_execution",
      };

      setSelectedExecutionWorkOrder(updatedOrder);

      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao iniciar execução.";

      setErrorMessage(message);
    } finally {
      setStartingExecution(false);
    }
  }

  async function handleCompleteTask(task: WorkOrderTask) {
    setCompletingTaskId(task.id);
    clearMessages();

    try {
      await completeWorkOrderTask({
        taskId: task.id,
        answerText: "Concluído pelo painel de execução.",
        answerNumber: null,
        answerBoolean: true,
        complianceResult: true,
      });

      setSuccessMessage("Subtarefa concluída com sucesso.");

      await refreshExecutionTasks();
      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao concluir subtarefa.";

      setErrorMessage(message);
    } finally {
      setCompletingTaskId(null);
    }
  }

  async function handleFinishParticipation() {
    if (!selectedExecutionWorkOrder) return;

    setFinishingParticipation(true);
    clearMessages();

    try {
      await finishWorkOrderParticipation({
        workOrderId: selectedExecutionWorkOrder.id,
        reason: finishParticipationReason.trim() || null,
      });

      setSuccessMessage("Participação finalizada com sucesso.");
      await loadData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao finalizar participação.";

      setErrorMessage(message);
    } finally {
      setFinishingParticipation(false);
    }
  }

  async function handleFinishWorkOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedExecutionWorkOrder) return;

    const hasPendingRequiredTasks = executionTasks.some(
      (task) => task.is_required && task.status === "pending"
    );

    if (hasPendingRequiredTasks) {
      setErrorMessage("Existem subtarefas obrigatórias pendentes.");
      return;
    }

    setFinishingOrder(true);
    clearMessages();

    try {
      await finishWorkOrder({
        workOrderId: selectedExecutionWorkOrder.id,
        executionDescription,
        identifiedCause,
        solutionApplied,
        result: finalResult,
        materialsUsed: materialsUsed.trim() || null,
        internalNotes: internalNotes.trim() || null,
        sendToValidation,
      });

      setSuccessMessage("OS finalizada com sucesso.");
      closeExecutionPanel();

      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao finalizar OS.";

      setErrorMessage(message);
    } finally {
      setFinishingOrder(false);
    }
  }

  async function handleValidateWorkOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedValidationWorkOrder) return;

    if (validationResult === "rejected" && !rejectionReason.trim()) {
      setErrorMessage("Informe o motivo da reprovação.");
      return;
    }

    setValidating(true);
    clearMessages();

    try {
      await validateWorkOrder({
        workOrderId: selectedValidationWorkOrder.id,
        validationResult,
        rejectionReason:
          validationResult === "rejected" ? rejectionReason.trim() : null,
        comment: validationComment.trim() || null,
      });

      setSuccessMessage(
        validationResult === "approved"
          ? "OS aprovada com sucesso."
          : "OS reprovada com sucesso."
      );

      closeValidationPanel();

      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao validar OS.";

      setErrorMessage(message);
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Execução operacional</span>
          <h1>Ordens de Serviço</h1>
          <p>
            Liste, filtre, planeje, crie subtarefas, libere, execute e valide
            ordens de serviço do workspace{" "}
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

      {selectedExecutionWorkOrder && (
        <section className={styles.formCard}>
          <div className={styles.formHeader}>
            <div>
              <span>Execução técnica</span>
              <h2>Executar OS {selectedExecutionWorkOrder.work_order_code}</h2>
              <p>
                {selectedExecutionWorkOrder.asset_code} -{" "}
                {selectedExecutionWorkOrder.asset_name}
              </p>
            </div>
          </div>

          {selectedExecutionWorkOrder.status === "released" && (
            <div className={styles.executionBlock}>
              <h3>Iniciar execução</h3>

              <label>
                Observação de início
                <textarea
                  value={startReason}
                  onChange={(event) => setStartReason(event.target.value)}
                  rows={3}
                  placeholder="Ex: Técnico chegou ao local e iniciou verificação."
                />
              </label>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeExecutionPanel}
                >
                  Fechar
                </button>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleStartExecution}
                  disabled={startingExecution}
                >
                  <PlayCircle size={16} />
                  {startingExecution ? "Iniciando..." : "Iniciar execução"}
                </button>
              </div>
            </div>
          )}

          {(selectedExecutionWorkOrder.status === "in_execution" ||
            selectedExecutionWorkOrder.status === "paused") && (
              <>
                <div className={styles.executionBlock}>
                  <h3>Checklist da OS</h3>

                  {executionTasks.length === 0 ? (
                    <p className={styles.mutedText}>
                      Nenhuma subtarefa cadastrada para esta OS.
                    </p>
                  ) : (
                    <div className={styles.taskList}>
                      {executionTasks.map((task) => (
                        <article key={task.id} className={styles.taskItem}>
                          <div>
                            <strong>{task.title}</strong>
                            <span>
                              {responseTypeLabels[task.response_type]} ·{" "}
                              {task.is_required ? "Obrigatória" : "Opcional"} ·{" "}
                              {task.status === "completed"
                                ? "Concluída"
                                : task.status === "not_applicable"
                                  ? "Não aplicável"
                                  : "Pendente"}
                            </span>
                            {task.description && <p>{task.description}</p>}
                          </div>

                          {task.status === "pending" && (
                            <button
                              type="button"
                              className={styles.actionButton}
                              onClick={() => handleCompleteTask(task)}
                              disabled={completingTaskId === task.id}
                            >
                              <CheckCircle2 size={16} />
                              {completingTaskId === task.id
                                ? "Concluindo..."
                                : "Concluir"}
                            </button>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.executionBlock}>
                  <h3>Finalizar participação</h3>

                  <label>
                    Observação da participação
                    <textarea
                      value={finishParticipationReason}
                      onChange={(event) =>
                        setFinishParticipationReason(event.target.value)
                      }
                      rows={3}
                      placeholder="Ex: Técnico finalizou sua atividade na OS."
                    />
                  </label>

                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={handleFinishParticipation}
                    disabled={finishingParticipation}
                  >
                    {finishingParticipation
                      ? "Finalizando..."
                      : "Finalizar minha participação"}
                  </button>
                </div>

                <form onSubmit={handleFinishWorkOrder} className={styles.form}>
                  <label className={styles.fullField}>
                    Descrição do serviço executado
                    <textarea
                      value={executionDescription}
                      onChange={(event) =>
                        setExecutionDescription(event.target.value)
                      }
                      rows={4}
                      placeholder="Descreva exatamente o que foi feito."
                      required
                    />
                  </label>

                  <label className={styles.fullField}>
                    Causa identificada
                    <textarea
                      value={identifiedCause}
                      onChange={(event) => setIdentifiedCause(event.target.value)}
                      rows={3}
                      placeholder="Ex: Vedação danificada na conexão."
                      required
                    />
                  </label>

                  <label className={styles.fullField}>
                    Solução aplicada
                    <textarea
                      value={solutionApplied}
                      onChange={(event) => setSolutionApplied(event.target.value)}
                      rows={3}
                      placeholder="Ex: Substituição da vedação e teste de estanqueidade."
                      required
                    />
                  </label>

                  <label>
                    Resultado final
                    <select
                      value={finalResult}
                      onChange={(event) =>
                        setFinalResult(event.target.value as FinalResult)
                      }
                    >
                      {Object.entries(finalResultLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Enviar para validação?
                    <select
                      value={sendToValidation ? "yes" : "no"}
                      onChange={(event) =>
                        setSendToValidation(event.target.value === "yes")
                      }
                    >
                      <option value="yes">Sim</option>
                      <option value="no">Não</option>
                    </select>
                  </label>

                  <label className={styles.fullField}>
                    Materiais utilizados
                    <textarea
                      value={materialsUsed}
                      onChange={(event) => setMaterialsUsed(event.target.value)}
                      rows={3}
                      placeholder="Ex: Veda rosca, conexão, parafusos..."
                    />
                  </label>

                  <label className={styles.fullField}>
                    Observações internas
                    <textarea
                      value={internalNotes}
                      onChange={(event) => setInternalNotes(event.target.value)}
                      rows={3}
                      placeholder="Observações internas para a equipe."
                    />
                  </label>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={closeExecutionPanel}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={finishingOrder}
                    >
                      <CheckCircle2 size={16} />
                      {finishingOrder ? "Finalizando..." : "Finalizar OS"}
                    </button>
                  </div>
                </form>
              </>
            )}
        </section>
      )}

      {selectedValidationWorkOrder && (
        <section className={styles.formCard}>
          <div className={styles.formHeader}>
            <div>
              <span>Validação</span>
              <h2>Validar OS {selectedValidationWorkOrder.work_order_code}</h2>
              <p>
                {selectedValidationWorkOrder.asset_code} -{" "}
                {selectedValidationWorkOrder.asset_name}
              </p>
            </div>
          </div>

          <form onSubmit={handleValidateWorkOrder} className={styles.form}>
            <label>
              Resultado da validação
              <select
                value={validationResult}
                onChange={(event) =>
                  setValidationResult(
                    event.target.value as WorkOrderValidationResult
                  )
                }
              >
                <option value="approved">Aprovar</option>
                <option value="rejected">Reprovar</option>
              </select>
            </label>

            {validationResult === "rejected" && (
              <label className={styles.fullField}>
                Motivo da reprovação
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows={3}
                  placeholder="Explique o motivo da reprovação."
                  required
                />
              </label>
            )}

            <label className={styles.fullField}>
              Comentário
              <textarea
                value={validationComment}
                onChange={(event) => setValidationComment(event.target.value)}
                rows={3}
                placeholder="Comentário opcional sobre a validação."
              />
            </label>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeValidationPanel}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={validating}
              >
                <CheckCircle2 size={16} />
                {validating
                  ? "Validando..."
                  : validationResult === "approved"
                    ? "Aprovar OS"
                    : "Reprovar OS"}
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
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => openExecutionPanel(order)}
                    >
                      <PlayCircle size={16} />
                      Iniciar execução
                    </button>
                  )}

                  {order.status === "in_execution" && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => openExecutionPanel(order)}
                    >
                      <PlayCircle size={16} />
                      Continuar execução
                    </button>
                  )}

                  {order.status === "paused" && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => openExecutionPanel(order)}
                    >
                      <PlayCircle size={16} />
                      Retomar execução
                    </button>
                  )}

                  {order.status === "waiting_validation" && (
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => openValidationPanel(order)}
                    >
                      <CheckCircle2 size={16} />
                      Validar OS
                    </button>
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