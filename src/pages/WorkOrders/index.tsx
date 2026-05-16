import { useEffect, useState, type FormEvent } from "react";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import {
  getWorkspaceOperationalMembers,
  type WorkspaceOperationalMember,
} from "../../services/workspaceMemberService";
import {
  addWorkOrderTask,
  applyStandardWorkOrderTasks,
  completeWorkOrderTask,
  deleteWorkOrderTask,
  finishWorkOrder,
  finishWorkOrderParticipation,
  getWorkOrderReport,
  getWorkOrders,
  markWorkOrderTaskNotApplicable,
  planWorkOrder,
  releaseWorkOrder,
  reopenRejectedWorkOrder,
  startWorkOrderParticipation,
  updateWorkOrderDetails,
  updateWorkOrderTask,
  validateWorkOrder,
} from "../../services/workOrderService";
import type {
  AddWorkOrderTaskInput,
  CompleteWorkOrderTaskInput,
  DeleteWorkOrderTaskInput,
  FinishWorkOrderInput,
  FinishWorkOrderParticipationInput,
  MarkWorkOrderTaskNotApplicableInput,
  PlanWorkOrderInput,
  ReleaseWorkOrderInput,
  ReopenRejectedWorkOrderInput,
  StartWorkOrderParticipationInput,
  UpdateWorkOrderDetailsInput,
  UpdateWorkOrderTaskInput,
  ValidateWorkOrderInput,
  WorkOrderListItem,
  WorkOrderReport,
} from "../../types/workOrder";
import styles from "./styles.module.css";

import { WorkOrdersFeedback } from "./components/WorkOrdersFeedback";
import { WorkOrdersFilters } from "./components/WorkOrdersFilters";
import { WorkOrdersHeader } from "./components/WorkOrdersHeader";
import { WorkOrderActionDrawer } from "./components/WorkOrderActionDrawer";
import { WorkOrderDetailsDrawer } from "./components/WorkOrderDetailsDrawer";
import { WorkOrdersKanbanBoard } from "./components/WorkOrdersKanbanBoard";
import { WorkOrdersTable } from "./components/WorkOrdersTable";
import {
  WorkOrdersViewToggle,
  type WorkOrdersViewMode,
} from "./components/WorkOrdersViewToggle";
import { type StatusFilter } from "./constants/workOrderLabels";
import type { WorkOrderQuickAction } from "./utils/workOrderQuickActions";

export function WorkOrders() {
  const { currentWorkspace } = useWorkspace();

  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [operationalMembers, setOperationalMembers] = useState<
    WorkspaceOperationalMember[]
  >([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<WorkOrdersViewMode>("kanban");

  const [selectedDetailsWorkOrder, setSelectedDetailsWorkOrder] =
    useState<WorkOrderListItem | null>(null);
  const [selectedActionWorkOrder, setSelectedActionWorkOrder] =
    useState<WorkOrderListItem | null>(null);
  const [activeQuickAction, setActiveQuickAction] =
    useState<WorkOrderQuickAction | null>(null);
  const [workOrderDetailsReport, setWorkOrderDetailsReport] =
    useState<WorkOrderReport | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingOperationalMembers, setLoadingOperationalMembers] =
    useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [savingDetails, setSavingDetails] = useState(false);
  const [savingDrawerPlanning, setSavingDrawerPlanning] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [applyingStandardTasks, setApplyingStandardTasks] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [markingTaskNotApplicableId, setMarkingTaskNotApplicableId] =
    useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const [releasing, setReleasing] = useState(false);
  const [startingExecution, setStartingExecution] = useState(false);
  const [finishingParticipation, setFinishingParticipation] = useState(false);
  const [finishingOrder, setFinishingOrder] = useState(false);
  const [validating, setValidating] = useState(false);
  const [reopeningRejected, setReopeningRejected] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

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

  async function loadOperationalMembers() {
    if (!currentWorkspace) return;

    setLoadingOperationalMembers(true);

    try {
      const members = await getWorkspaceOperationalMembers(
        currentWorkspace.workspace_id
      );

      setOperationalMembers(members);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar membros do workspace.";

      setErrorMessage(message);
    } finally {
      setLoadingOperationalMembers(false);
    }
  }

  useEffect(() => {
    loadOperationalMembers();
  }, [currentWorkspace?.workspace_id]);

  useEffect(() => {
    loadData();
  }, [currentWorkspace?.workspace_id, statusFilter]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadData();
  }

  async function openDetailsDrawer(workOrder: WorkOrderListItem) {
    clearMessages();
    setSelectedDetailsWorkOrder(workOrder);
    setWorkOrderDetailsReport(null);
    setLoadingDetails(true);

    try {
      const report = await getWorkOrderReport(workOrder.id);
      setWorkOrderDetailsReport(report);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar detalhes da OS.";

      setErrorMessage(message);
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeDetailsDrawer() {
    setSelectedDetailsWorkOrder(null);
    setWorkOrderDetailsReport(null);
  }

  function openQuickActionDrawer(
    workOrder: WorkOrderListItem,
    action: WorkOrderQuickAction
  ) {
    if (action === "details") {
      openDetailsDrawer(workOrder);
      return;
    }

    clearMessages();
    setSelectedActionWorkOrder(workOrder);
    setActiveQuickAction(action);
  }

  function closeQuickActionDrawer() {
    setSelectedActionWorkOrder(null);
    setActiveQuickAction(null);
  }

  function openDetailsFromQuickAction(workOrder: WorkOrderListItem) {
    closeQuickActionDrawer();
    openDetailsDrawer(workOrder);
  }

  async function refreshActionWorkOrder(workOrderId: string) {
    const latestOrder = workOrders.find((workOrder) => workOrder.id === workOrderId);

    if (latestOrder) {
      setSelectedActionWorkOrder(latestOrder);
    }
  }

  async function refreshDetailsDrawer(workOrderId: string) {
    const report = await getWorkOrderReport(workOrderId);
    setWorkOrderDetailsReport(report);
  }

  async function refreshSelectedOrder(workOrderId: string) {
    await refreshDetailsDrawer(workOrderId);
    await loadData();
  }

  async function handleUpdateWorkOrderDetailsFromDrawer(
    input: UpdateWorkOrderDetailsInput
  ) {
    setSavingDetails(true);
    clearMessages();

    try {
      await updateWorkOrderDetails(input);

      setSelectedDetailsWorkOrder((current) => {
        if (!current || current.id !== input.workOrderId) return current;

        return {
          ...current,
          title: input.title,
          description: input.description ?? "",
          priority: input.priority,
          maintenance_type: input.maintenanceType,
        };
      });

      await refreshSelectedOrder(input.workOrderId);
      setSuccessMessage("Dados principais da OS atualizados com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao atualizar dados principais da OS.";

      setErrorMessage(message);
      throw error;
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleUpdatePlanningFromDrawer(input: PlanWorkOrderInput) {
    if (new Date(input.scheduledEndAt) <= new Date(input.scheduledStartAt)) {
      const message = "A data final precisa ser maior que a data inicial.";
      setErrorMessage(message);
      throw new Error(message);
    }

    if (!input.primaryUserId) {
      const message = "Selecione o responsável principal da OS.";
      setErrorMessage(message);
      throw new Error(message);
    }

    setSavingDrawerPlanning(true);
    clearMessages();

    try {
      await planWorkOrder(input);

      const primaryMember = operationalMembers.find(
        (member) => member.userId === input.primaryUserId
      );
      const primaryName =
        primaryMember?.fullName?.trim() ||
        primaryMember?.email ||
        "Responsável definido";

      setSelectedDetailsWorkOrder((current) => {
        if (!current || current.id !== input.workOrderId) return current;

        return {
          ...current,
          status: current.status === "waiting_planning" ? "planned" : current.status,
          primary_user_id: input.primaryUserId,
          primary_user_name: primaryName,
          scheduled_start_at: input.scheduledStartAt,
          scheduled_end_at: input.scheduledEndAt,
          estimated_duration_minutes: input.estimatedDurationMinutes,
          assigned_users_count: 1 + input.supportUserIds.length,
        };
      });

      await refreshSelectedOrder(input.workOrderId);
      await refreshActionWorkOrder(input.workOrderId);
      setSuccessMessage("Planejamento da OS atualizado com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao atualizar planejamento da OS.";

      setErrorMessage(message);
      throw error;
    } finally {
      setSavingDrawerPlanning(false);
    }
  }

  async function handleAddTaskFromDrawer(input: AddWorkOrderTaskInput) {
    setAddingTask(true);
    clearMessages();

    try {
      await addWorkOrderTask(input);
      await refreshSelectedOrder(input.workOrderId);
      setSuccessMessage("Subtarefa adicionada com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao adicionar subtarefa.";

      setErrorMessage(message);
      throw error;
    } finally {
      setAddingTask(false);
    }
  }

  async function handleUpdateTaskFromDrawer(input: UpdateWorkOrderTaskInput) {
    if (!selectedDetailsWorkOrder) return;

    setUpdatingTaskId(input.taskId);
    clearMessages();

    try {
      await updateWorkOrderTask(input);
      await refreshSelectedOrder(selectedDetailsWorkOrder.id);
      setSuccessMessage("Subtarefa atualizada com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao atualizar subtarefa.";

      setErrorMessage(message);
      throw error;
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function handleDeleteTaskFromDrawer(input: DeleteWorkOrderTaskInput) {
    if (!selectedDetailsWorkOrder) return;

    setDeletingTaskId(input.taskId);
    clearMessages();

    try {
      await deleteWorkOrderTask(input);
      await refreshSelectedOrder(selectedDetailsWorkOrder.id);
      setSuccessMessage("Subtarefa excluída com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao excluir subtarefa.";

      setErrorMessage(message);
      throw error;
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function handleApplyStandardTasksFromDrawer(workOrderId: string) {
    setApplyingStandardTasks(true);
    clearMessages();

    try {
      const insertedTasks = await applyStandardWorkOrderTasks({ workOrderId });

      await refreshSelectedOrder(workOrderId);

      setSuccessMessage(
        insertedTasks === 0
          ? "Nenhuma nova subtarefa foi aplicada. A OS já possui este checklist ou não há template ativo."
          : `${insertedTasks} subtarefa${insertedTasks > 1 ? "s" : ""} padrão aplicada${insertedTasks > 1 ? "s" : ""} com sucesso.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao aplicar checklist padrão.";

      setErrorMessage(message);
      throw error;
    } finally {
      setApplyingStandardTasks(false);
    }
  }

  async function handleCompleteTaskFromDrawer(input: CompleteWorkOrderTaskInput) {
    if (!selectedDetailsWorkOrder) return;

    setCompletingTaskId(input.taskId);
    clearMessages();

    try {
      await completeWorkOrderTask(input);
      await refreshSelectedOrder(selectedDetailsWorkOrder.id);
      setSuccessMessage("Subtarefa concluída com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao concluir subtarefa.";

      setErrorMessage(message);
      throw error;
    } finally {
      setCompletingTaskId(null);
    }
  }

  async function handleMarkTaskNotApplicableFromDrawer(
    input: MarkWorkOrderTaskNotApplicableInput
  ) {
    if (!selectedDetailsWorkOrder) return;

    setMarkingTaskNotApplicableId(input.taskId);
    clearMessages();

    try {
      await markWorkOrderTaskNotApplicable(input);
      await refreshSelectedOrder(selectedDetailsWorkOrder.id);
      setSuccessMessage("Subtarefa marcada como não aplicável.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao marcar subtarefa como não aplicável.";

      setErrorMessage(message);
      throw error;
    } finally {
      setMarkingTaskNotApplicableId(null);
    }
  }

  async function handleReleaseFromDrawer(input: ReleaseWorkOrderInput) {
    setReleasing(true);
    clearMessages();

    try {
      await releaseWorkOrder(input);
      setSelectedDetailsWorkOrder((current) =>
        current && current.id === input.workOrderId
          ? { ...current, status: "released" }
          : current
      );
      setSelectedActionWorkOrder((current) =>
        current && current.id === input.workOrderId
          ? { ...current, status: "released" }
          : current
      );
      await refreshSelectedOrder(input.workOrderId);
      setSuccessMessage("OS liberada para execução com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao liberar OS.";
      setErrorMessage(message);
      throw error;
    } finally {
      setReleasing(false);
    }
  }

  async function handleReopenRejectedFromDrawer(input: ReopenRejectedWorkOrderInput) {
    setReopeningRejected(true);
    clearMessages();

    try {
      await reopenRejectedWorkOrder(input);
      setSelectedDetailsWorkOrder((current) =>
        current && current.id === input.workOrderId
          ? { ...current, status: "planned" }
          : current
      );
      setSelectedActionWorkOrder((current) =>
        current && current.id === input.workOrderId
          ? { ...current, status: "planned" }
          : current
      );
      await refreshSelectedOrder(input.workOrderId);
      setSuccessMessage("OS reaberta para replanejamento.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao reabrir OS para replanejamento.";
      setErrorMessage(message);
      throw error;
    } finally {
      setReopeningRejected(false);
    }
  }

  async function handleStartExecutionFromDrawer(
    input: StartWorkOrderParticipationInput
  ) {
    setStartingExecution(true);
    clearMessages();

    try {
      await startWorkOrderParticipation(input);
      setSelectedDetailsWorkOrder((current) =>
        current && current.id === input.workOrderId
          ? { ...current, status: "in_execution", open_time_logs_count: (current.open_time_logs_count ?? 0) + 1, current_user_has_open_time_log: true }
          : current
      );
      setSelectedActionWorkOrder((current) =>
        current && current.id === input.workOrderId
          ? { ...current, status: "in_execution", open_time_logs_count: (current.open_time_logs_count ?? 0) + 1, current_user_has_open_time_log: true }
          : current
      );
      await refreshSelectedOrder(input.workOrderId);
      setSuccessMessage("Execução iniciada com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao iniciar execução.";
      setErrorMessage(message);
      throw error;
    } finally {
      setStartingExecution(false);
    }
  }

  async function handleFinishParticipationFromDrawer(
    input: FinishWorkOrderParticipationInput
  ) {
    setFinishingParticipation(true);
    clearMessages();

    try {
      await finishWorkOrderParticipation(input);
      setSelectedDetailsWorkOrder((current) =>
        current && current.id === input.workOrderId
          ? {
              ...current,
              open_time_logs_count: Math.max(0, (current.open_time_logs_count ?? 0) - 1),
              current_user_has_open_time_log: false,
            }
          : current
      );
      setSelectedActionWorkOrder((current) =>
        current && current.id === input.workOrderId
          ? {
              ...current,
              open_time_logs_count: Math.max(0, (current.open_time_logs_count ?? 0) - 1),
              current_user_has_open_time_log: false,
            }
          : current
      );
      await refreshSelectedOrder(input.workOrderId);
      await loadData();
      setSuccessMessage("Participação finalizada com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao finalizar participação.";
      setErrorMessage(message);
      throw error;
    } finally {
      setFinishingParticipation(false);
    }
  }

  async function handleFinishWorkOrderFromDrawer(input: FinishWorkOrderInput) {
    setFinishingOrder(true);
    clearMessages();

    try {
      await finishWorkOrder(input);
      await refreshSelectedOrder(input.workOrderId);
      await loadData();
      setSuccessMessage("OS finalizada com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao finalizar OS.";
      setErrorMessage(message);
      throw error;
    } finally {
      setFinishingOrder(false);
    }
  }

  async function handleValidateFromDrawer(input: ValidateWorkOrderInput) {
    if (input.validationResult === "rejected" && !input.rejectionReason?.trim()) {
      const message = "Informe o motivo da reprovação.";
      setErrorMessage(message);
      throw new Error(message);
    }

    setValidating(true);
    clearMessages();

    try {
      await validateWorkOrder(input);
      await refreshSelectedOrder(input.workOrderId);
      await loadData();
      setSuccessMessage(
        input.validationResult === "approved"
          ? "OS aprovada com sucesso."
          : "OS reprovada com sucesso."
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao validar OS.";
      setErrorMessage(message);
      throw error;
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className={styles.page}>
      <WorkOrdersHeader
        workspaceName={currentWorkspace?.workspace_name}
        onRefresh={loadData}
      />

      <WorkOrdersFeedback
        errorMessage={errorMessage}
        successMessage={successMessage}
      />

      <WorkOrderActionDrawer
        workOrder={selectedActionWorkOrder}
        action={activeQuickAction}
        members={operationalMembers}
        loadingMembers={loadingOperationalMembers}
        savingPlanning={savingDrawerPlanning}
        releasing={releasing}
        startingExecution={startingExecution}
        finishingParticipation={finishingParticipation}
        validating={validating}
        reopeningRejected={reopeningRejected}
        finishingOrder={finishingOrder}
        onClose={closeQuickActionDrawer}
        onOpenDetails={openDetailsFromQuickAction}
        onPlan={handleUpdatePlanningFromDrawer}
        onRelease={handleReleaseFromDrawer}
        onStartExecution={handleStartExecutionFromDrawer}
        onFinishParticipation={handleFinishParticipationFromDrawer}
        onValidate={handleValidateFromDrawer}
        onReopenRejected={handleReopenRejectedFromDrawer}
        onFinishWorkOrder={handleFinishWorkOrderFromDrawer}
      />

      <WorkOrderDetailsDrawer
        workOrder={selectedDetailsWorkOrder}
        report={workOrderDetailsReport}
        loading={loadingDetails}
        members={operationalMembers}
        loadingMembers={loadingOperationalMembers}
        savingDetails={savingDetails}
        savingPlanning={savingDrawerPlanning}
        savingTaskStructure={addingTask}
        applyingStandardTasks={applyingStandardTasks}
        completingTaskId={completingTaskId}
        markingTaskNotApplicableId={markingTaskNotApplicableId}
        updatingTaskId={updatingTaskId}
        deletingTaskId={deletingTaskId}
        releasing={releasing}
        startingExecution={startingExecution}
        finishingParticipation={finishingParticipation}
        finishingOrder={finishingOrder}
        validating={validating}
        onClose={closeDetailsDrawer}
        onUpdateDetails={handleUpdateWorkOrderDetailsFromDrawer}
        onUpdatePlanning={handleUpdatePlanningFromDrawer}
        onAddTask={handleAddTaskFromDrawer}
        onUpdateTask={handleUpdateTaskFromDrawer}
        onDeleteTask={handleDeleteTaskFromDrawer}
        onApplyStandardTasks={handleApplyStandardTasksFromDrawer}
        onCompleteTask={handleCompleteTaskFromDrawer}
        onMarkTaskNotApplicable={handleMarkTaskNotApplicableFromDrawer}
        onRelease={handleReleaseFromDrawer}
        onReopenRejected={handleReopenRejectedFromDrawer}
        onStartExecution={handleStartExecutionFromDrawer}
        onFinishParticipation={handleFinishParticipationFromDrawer}
        onFinishWorkOrder={handleFinishWorkOrderFromDrawer}
        onValidate={handleValidateFromDrawer}
      />

      <WorkOrdersFilters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onSubmit={handleSearchSubmit}
      />

      <WorkOrdersViewToggle
        viewMode={viewMode}
        totalItems={workOrders.length}
        onViewModeChange={setViewMode}
      />

      {viewMode === "kanban" ? (
        <WorkOrdersKanbanBoard
          loading={loading}
          workOrders={workOrders}
          onOpenDetails={openDetailsDrawer}
          onOpenAction={openQuickActionDrawer}
        />
      ) : (
        <WorkOrdersTable
          loading={loading}
          workOrders={workOrders}
          onOpenDetails={openDetailsDrawer}
          onOpenAction={openQuickActionDrawer}
        />
      )}
    </div>
  );
}
