import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { getWorkspaceOperationalMembers, type WorkspaceOperationalMember } from "../../services/workspaceMemberService";
import {
  addWorkOrderTask,
  applyStandardWorkOrderTasks,
  completeWorkOrderTask,
  finishWorkOrder,
  finishWorkOrderParticipation,
  getWorkOrderReport,
  getWorkOrderTasks,
  getWorkOrders,
  planWorkOrder,
  releaseWorkOrder,
  reopenRejectedWorkOrder,
  startWorkOrderParticipation,
  validateWorkOrder,
} from "../../services/workOrderService";
import type {
  FinalResult,
  TaskResponseType,
  WorkOrderListItem,
  WorkOrderReport,
  WorkOrderTask,
  WorkOrderValidationResult,
} from "../../types/workOrder";
import styles from "./styles.module.css";

import { WorkOrdersFeedback } from "./components/WorkOrdersFeedback";
import { WorkOrdersFilters } from "./components/WorkOrdersFilters";
import { WorkOrdersHeader } from "./components/WorkOrdersHeader";
import { WorkOrderPlanningPanel } from "./components/WorkOrderPlanningPanel";
import { WorkOrderReleasePanel } from "./components/WorkOrderReleasePanel";
import { WorkOrderTaskPanel } from "./components/WorkOrderTaskPanel";
import { WorkOrderValidationPanel } from "./components/WorkOrderValidationPanel";
import { WorkOrderExecutionPanel } from "./components/WorkOrderExecutionPanel";
import { WorkOrderReportPanel } from "./components/WorkOrderReportPanel";
import { WorkOrderDetailsDrawer } from "./components/WorkOrderDetailsDrawer";
import { WorkOrdersKanbanBoard } from "./components/WorkOrdersKanbanBoard";
import { WorkOrdersTable } from "./components/WorkOrdersTable";
import { WorkOrdersViewToggle, type WorkOrdersViewMode } from "./components/WorkOrdersViewToggle";
import { type StatusFilter } from "./constants/workOrderLabels";
import {
  getDefaultEndDateTime,
  getDefaultStartDateTime,
  toIsoFromLocalInput,
} from "./utils/workOrderFormatters";

export function WorkOrders() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [operationalMembers, setOperationalMembers] = useState<WorkspaceOperationalMember[]>([]);


  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<WorkOrdersViewMode>("kanban");

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

  const [selectedReportWorkOrder, setSelectedReportWorkOrder] =
    useState<WorkOrderListItem | null>(null);

  const [selectedDetailsWorkOrder, setSelectedDetailsWorkOrder] =
    useState<WorkOrderListItem | null>(null);

  const [workOrderReport, setWorkOrderReport] =
    useState<WorkOrderReport | null>(null);

  const [workOrderDetailsReport, setWorkOrderDetailsReport] =
    useState<WorkOrderReport | null>(null);

  const [executionTasks, setExecutionTasks] = useState<WorkOrderTask[]>([]);

  const [scheduledStartAt, setScheduledStartAt] = useState(
    getDefaultStartDateTime()
  );
  const [scheduledEndAt, setScheduledEndAt] = useState(getDefaultEndDateTime());
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(120);
  const [selectedPrimaryUserId, setSelectedPrimaryUserId] = useState("");
  const [selectedSupportUserIds, setSelectedSupportUserIds] = useState<string[]>([]);
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
  const [loadingOperationalMembers, setLoadingOperationalMembers] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [applyingStandardTasks, setApplyingStandardTasks] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [startingExecution, setStartingExecution] = useState(false);
  const [finishingParticipation, setFinishingParticipation] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [finishingOrder, setFinishingOrder] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canPlanSelectedOrder = useMemo(() => {
    return (
      selectedWorkOrder?.status === "waiting_planning" ||
      selectedWorkOrder?.status === "planned"
    );
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
    setSelectedReportWorkOrder(null);
    setSelectedDetailsWorkOrder(null);
    setWorkOrderReport(null);
    setWorkOrderDetailsReport(null);
  }

  async function openDetailsDrawer(workOrder: WorkOrderListItem) {
    closeAllPanels();
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

  function openPlanningPanel(workOrder: WorkOrderListItem) {
    closeAllPanels();

    setSelectedWorkOrder(workOrder);
    setScheduledStartAt(getDefaultStartDateTime());
    setScheduledEndAt(getDefaultEndDateTime());
    setEstimatedDurationMinutes(workOrder.estimated_duration_minutes ?? 120);
    setSelectedPrimaryUserId(workOrder.primary_user_id ?? user?.id ?? "");
    setSelectedSupportUserIds([]);
    setPlanningNote("");

    clearMessages();
  }

  function closePlanningPanel() {
    setSelectedWorkOrder(null);
    setScheduledStartAt(getDefaultStartDateTime());
    setScheduledEndAt(getDefaultEndDateTime());
    setEstimatedDurationMinutes(120);
    setSelectedPrimaryUserId("");
    setSelectedSupportUserIds([]);
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

  async function openReportPanel(workOrder: WorkOrderListItem) {
    closeAllPanels();

    setSelectedReportWorkOrder(workOrder);
    setWorkOrderReport(null);
    setLoadingReport(true);

    clearMessages();

    try {
      const report = await getWorkOrderReport(workOrder.id);
      setWorkOrderReport(report);

      if (!report) {
        setErrorMessage("Relatório não encontrado para esta OS.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao carregar relatório.";

      setErrorMessage(message);
    } finally {
      setLoadingReport(false);
    }
  }

  function closeReportPanel() {
    setSelectedReportWorkOrder(null);
    setSelectedDetailsWorkOrder(null);
    setWorkOrderReport(null);
    setWorkOrderDetailsReport(null);
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
      setErrorMessage("Apenas OS aguardando planejamento ou planejadas podem ser editadas no planejamento.");
      return;
    }

    if (!selectedPrimaryUserId) {
      setErrorMessage("Selecione o responsável principal da OS.");
      return;
    }

    if (new Date(scheduledEndAt) <= new Date(scheduledStartAt)) {
      setErrorMessage("A data final precisa ser maior que a data inicial.");
      return;
    }

    const supportUserIds = selectedSupportUserIds.filter(
      (supportUserId) => supportUserId !== selectedPrimaryUserId
    );

    setPlanning(true);
    clearMessages();

    try {
      await planWorkOrder({
        workOrderId: selectedWorkOrder.id,
        primaryUserId: selectedPrimaryUserId,
        supportUserIds,
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

  async function handleApplyStandardTasks() {
    if (!selectedTaskWorkOrder) return;

    setApplyingStandardTasks(true);
    clearMessages();

    try {
      const insertedTasks = await applyStandardWorkOrderTasks({
        workOrderId: selectedTaskWorkOrder.id,
      });

      if (insertedTasks === 0) {
        setSuccessMessage(
          "Nenhuma nova subtarefa foi aplicada. A OS já possui este checklist ou não há template ativo."
        );
      } else {
        setSuccessMessage(
          `${insertedTasks} subtarefa${insertedTasks > 1 ? "s" : ""} padrão aplicada${
            insertedTasks > 1 ? "s" : ""
          } com sucesso.`
        );
      }

      closeTaskPanel();
      await loadData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao aplicar checklist padrão.";

      setErrorMessage(message);
    } finally {
      setApplyingStandardTasks(false);
    }
  }


  async function handleReopenRejectedWorkOrder(workOrder: WorkOrderListItem) {
    clearMessages();

    try {
      await reopenRejectedWorkOrder({
        workOrderId: workOrder.id,
        reason: "Reabertura para replanejamento após reprovação.",
      });

      const reopenedWorkOrder: WorkOrderListItem = {
        ...workOrder,
        status: "planned",
      };

      await loadData();
      openPlanningPanel(reopenedWorkOrder);
      setSuccessMessage("OS reaberta para replanejamento.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao reabrir OS para replanejamento.";

      setErrorMessage(message);
    } finally {
      // A ação usa o feedback global de sucesso/erro da página.
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
      <WorkOrdersHeader
        workspaceName={currentWorkspace?.workspace_name}
        onRefresh={loadData}
      />

      <WorkOrdersFeedback
        errorMessage={errorMessage}
        successMessage={successMessage}
      />

      <WorkOrderDetailsDrawer
        workOrder={selectedDetailsWorkOrder}
        report={workOrderDetailsReport}
        loading={loadingDetails}
        onClose={closeDetailsDrawer}
      />

      <WorkOrderPlanningPanel
        workOrder={selectedWorkOrder}
        members={operationalMembers}
        loadingMembers={loadingOperationalMembers}
        selectedPrimaryUserId={selectedPrimaryUserId}
        selectedSupportUserIds={selectedSupportUserIds}
        scheduledStartAt={scheduledStartAt}
        scheduledEndAt={scheduledEndAt}
        estimatedDurationMinutes={estimatedDurationMinutes}
        planningNote={planningNote}
        planning={planning}
        onSelectedPrimaryUserIdChange={setSelectedPrimaryUserId}
        onSelectedSupportUserIdsChange={setSelectedSupportUserIds}
        onScheduledStartAtChange={setScheduledStartAt}
        onScheduledEndAtChange={setScheduledEndAt}
        onEstimatedDurationMinutesChange={setEstimatedDurationMinutes}
        onPlanningNoteChange={setPlanningNote}
        onClose={closePlanningPanel}
        onSubmit={handlePlanWorkOrder}
      />

      <WorkOrderTaskPanel
        workOrder={selectedTaskWorkOrder}
        taskTitle={taskTitle}
        taskDescription={taskDescription}
        taskResponseType={taskResponseType}
        taskIsRequired={taskIsRequired}
        taskRequiresPhoto={taskRequiresPhoto}
        addingTask={addingTask}
        applyingStandardTasks={applyingStandardTasks}
        onTaskTitleChange={setTaskTitle}
        onTaskDescriptionChange={setTaskDescription}
        onTaskResponseTypeChange={setTaskResponseType}
        onTaskIsRequiredChange={setTaskIsRequired}
        onTaskRequiresPhotoChange={setTaskRequiresPhoto}
        onClose={closeTaskPanel}
        onApplyStandardTasks={handleApplyStandardTasks}
        onSubmit={handleAddTask}
      />

      <WorkOrderReleasePanel
        workOrder={selectedReleaseWorkOrder}
        releaseReason={releaseReason}
        releasing={releasing}
        onReleaseReasonChange={setReleaseReason}
        onClose={closeReleasePanel}
        onSubmit={handleReleaseWorkOrder}
      />

      <WorkOrderExecutionPanel
        workOrder={selectedExecutionWorkOrder}
        executionTasks={executionTasks}
        startReason={startReason}
        finishParticipationReason={finishParticipationReason}
        executionDescription={executionDescription}
        identifiedCause={identifiedCause}
        solutionApplied={solutionApplied}
        finalResult={finalResult}
        materialsUsed={materialsUsed}
        internalNotes={internalNotes}
        sendToValidation={sendToValidation}
        startingExecution={startingExecution}
        completingTaskId={completingTaskId}
        finishingParticipation={finishingParticipation}
        finishingOrder={finishingOrder}
        onStartReasonChange={setStartReason}
        onFinishParticipationReasonChange={setFinishParticipationReason}
        onExecutionDescriptionChange={setExecutionDescription}
        onIdentifiedCauseChange={setIdentifiedCause}
        onSolutionAppliedChange={setSolutionApplied}
        onFinalResultChange={setFinalResult}
        onMaterialsUsedChange={setMaterialsUsed}
        onInternalNotesChange={setInternalNotes}
        onSendToValidationChange={setSendToValidation}
        onClose={closeExecutionPanel}
        onStartExecution={handleStartExecution}
        onCompleteTask={handleCompleteTask}
        onFinishParticipation={handleFinishParticipation}
        onFinishWorkOrder={handleFinishWorkOrder}
      />

      <WorkOrderValidationPanel
        workOrder={selectedValidationWorkOrder}
        validationResult={validationResult}
        validationComment={validationComment}
        rejectionReason={rejectionReason}
        validating={validating}
        onValidationResultChange={setValidationResult}
        onValidationCommentChange={setValidationComment}
        onRejectionReasonChange={setRejectionReason}
        onClose={closeValidationPanel}
        onSubmit={handleValidateWorkOrder}
      />

      <WorkOrderReportPanel
        workOrder={selectedReportWorkOrder}
        report={workOrderReport}
        loading={loadingReport}
        onClose={closeReportPanel}
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
            onPlan={openPlanningPanel}
          onAddTask={openTaskPanel}
          onRelease={openReleasePanel}
          onReopenRejected={handleReopenRejectedWorkOrder}
          onExecute={openExecutionPanel}
          onValidate={openValidationPanel}
          onOpenReport={openReportPanel}
          onOpenDetails={openDetailsDrawer}
        />
      ) : (
        <WorkOrdersTable
          loading={loading}
          workOrders={workOrders}
          onPlan={openPlanningPanel}
          onAddTask={openTaskPanel}
          onRelease={openReleasePanel}
          onReopenRejected={handleReopenRejectedWorkOrder}
          onExecute={openExecutionPanel}
          onValidate={openValidationPanel}
          onOpenReport={openReportPanel}
          onOpenDetails={openDetailsDrawer}
        />
      )}
    </div>
  );
}