import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, ListChecks, Timer } from "lucide-react";

import { Button } from "../../../../components/Button";
import type {
  FinalResult,
  MaintenanceType,
  PriorityLevel,
  TaskResponseType,
  WorkOrderReportHistory,
  WorkOrderReportTask,
  WorkOrderValidationResult,
} from "../../../../types/workOrder";
import {
  finalResultLabels,
  maintenanceTypeLabels,
  priorityLabels,
  statusLabels,
} from "../../constants/workOrderLabels";
import { drawerTabs, type DrawerTab } from "./constants";
import {
  createEmptyTaskDraft,
  formatJsonValue,
  getRequiredTasksProgressPercent,
  getTaskCompletionPayload,
  isBlank,
  toIsoFromLocalInput,
  toLocalDateTimeInput,
} from "./helpers";
import type { TaskCompletionDraft, WorkOrderDetailsDrawerProps } from "./types";
import { formatDateTime, formatMinutes } from "../../utils/workOrderFormatters";
import {
  canEditPlanning,
  canEditTaskStructure,
  canEditWorkOrderDetails,
  canFillTaskResponses,
} from "../../utils/workOrderPermissions";
import { DrawerHeader } from "./components/DrawerHeader";
import { DrawerTabs } from "./components/DrawerTabs";
import { TasksTab } from "./components/TasksTab";
import { OverviewTab } from "./components/OverviewTab";
import { RequestTab } from "./components/RequestTab";
import { ExecutionTab } from "./components/ExecutionTab";
import styles from "./styles.module.css";

function renderHistoryDetails(item: WorkOrderReportHistory) {
  const hasOldValue = item.old_value !== null && item.old_value !== undefined;
  const hasNewValue = item.new_value !== null && item.new_value !== undefined;

  if (!hasOldValue && !hasNewValue) return null;

  return (
    <details className={styles.historyDetails}>
      <summary>Ver dados alterados</summary>
      {hasOldValue && (
        <div>
          <span>Antes</span>
          <pre>{formatJsonValue(item.old_value)}</pre>
        </div>
      )}
      {hasNewValue && (
        <div>
          <span>Depois</span>
          <pre>{formatJsonValue(item.new_value)}</pre>
        </div>
      )}
    </details>
  );
}

export function WorkOrderDetailsDrawer({
  workOrder,
  report,
  loading,
  members,
  loadingMembers,
  savingDetails,
  savingPlanning,
  savingTaskStructure,
  applyingStandardTasks,
  completingTaskId,
  markingTaskNotApplicableId,
  updatingTaskId,
  deletingTaskId,
  releasing,
  startingExecution,
  finishingParticipation,
  finishingOrder,
  validating,
  onClose,
  onUpdateDetails,
  onUpdatePlanning,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onApplyStandardTasks,
  onCompleteTask,
  onMarkTaskNotApplicable,
  onRelease,
  onReopenRejected,
  onStartExecution,
  onFinishParticipation,
  onFinishWorkOrder,
  onValidate,
}: WorkOrderDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingPlanning, setEditingPlanning] = useState(false);

  const [detailsTitle, setDetailsTitle] = useState("");
  const [detailsDescription, setDetailsDescription] = useState("");
  const [detailsPriority, setDetailsPriority] = useState<PriorityLevel>("medium");
  const [detailsMaintenanceType, setDetailsMaintenanceType] =
    useState<MaintenanceType>("corrective");
  const [detailsReason, setDetailsReason] = useState("");

  const [planningPrimaryUserId, setPlanningPrimaryUserId] = useState("");
  const [planningSupportUserIds, setPlanningSupportUserIds] = useState<string[]>([]);
  const [planningStartAt, setPlanningStartAt] = useState("");
  const [planningEndAt, setPlanningEndAt] = useState("");
  const [planningEstimatedMinutes, setPlanningEstimatedMinutes] = useState(120);
  const [planningReason, setPlanningReason] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskResponseType, setTaskResponseType] = useState<TaskResponseType>("checkbox");
  const [taskIsRequired, setTaskIsRequired] = useState(true);
  const [taskRequiresPhoto, setTaskRequiresPhoto] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskDescription, setEditingTaskDescription] = useState("");
  const [editingTaskResponseType, setEditingTaskResponseType] = useState<TaskResponseType>("checkbox");
  const [editingTaskIsRequired, setEditingTaskIsRequired] = useState(true);
  const [editingTaskRequiresPhoto, setEditingTaskRequiresPhoto] = useState(false);
  const [editingTaskSortOrder, setEditingTaskSortOrder] = useState(0);
  const [editingTaskReason, setEditingTaskReason] = useState("");

  const [taskDrafts, setTaskDrafts] = useState<Record<string, TaskCompletionDraft>>({});

  const [releaseReason, setReleaseReason] = useState("");
  const [startReason, setStartReason] = useState("");
  const [finishParticipationReason, setFinishParticipationReason] = useState("");
  const [executionDescription, setExecutionDescription] = useState("");
  const [identifiedCause, setIdentifiedCause] = useState("");
  const [solutionApplied, setSolutionApplied] = useState("");
  const [finalResult, setFinalResult] = useState<FinalResult>("resolved");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [validationResult, setValidationResult] =
    useState<WorkOrderValidationResult>("approved");
  const [validationComment, setValidationComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!workOrder) return;

    setDetailsTitle(workOrder.title);
    setDetailsDescription(workOrder.description ?? "");
    setDetailsPriority(workOrder.priority);
    setDetailsMaintenanceType(workOrder.maintenance_type);
    setDetailsReason("");

    setPlanningPrimaryUserId(workOrder.primary_user_id ?? "");
    setPlanningSupportUserIds(
      (report?.assignments ?? [])
        .filter((assignment) => !assignment.is_primary && assignment.status !== "removed")
        .map((assignment) => assignment.user_id)
    );
    setPlanningStartAt(toLocalDateTimeInput(workOrder.scheduled_start_at));
    setPlanningEndAt(toLocalDateTimeInput(workOrder.scheduled_end_at));
    setPlanningEstimatedMinutes(workOrder.estimated_duration_minutes ?? 120);
    setPlanningReason("");

    setEditingDetails(false);
    setEditingPlanning(false);
    setTaskTitle("");
    setTaskDescription("");
    setTaskResponseType("checkbox");
    setTaskIsRequired(true);
    setTaskRequiresPhoto(false);
    setEditingTaskId(null);
    setEditingTaskTitle("");
    setEditingTaskDescription("");
    setEditingTaskResponseType("checkbox");
    setEditingTaskIsRequired(true);
    setEditingTaskRequiresPhoto(false);
    setEditingTaskSortOrder(0);
    setEditingTaskReason("");
    setTaskDrafts({});

    setReleaseReason("");
    setStartReason("");
    setFinishParticipationReason("");
    setExecutionDescription(workOrder.execution_description ?? "");
    setIdentifiedCause(workOrder.identified_cause ?? "");
    setSolutionApplied(workOrder.solution_applied ?? "");
    setFinalResult(workOrder.result ?? "resolved");
    setMaterialsUsed(report?.materials_used ?? "");
    setInternalNotes(report?.internal_notes ?? "");
    setValidationResult("approved");
    setValidationComment("");
    setRejectionReason("");
  }, [workOrder?.id, report?.assignments, report?.materials_used, report?.internal_notes]);

  const technicianMembers = useMemo(
    () => members.filter((member) => member.role === "technician"),
    [members]
  );

  if (!workOrder) return null;

  const assignments = report?.assignments ?? [];
  const tasks = report?.tasks ?? [];
  const attachments = report?.attachments ?? [];
  const validations = report?.validations ?? [];
  const history = report?.history ?? [];
  const serviceRequest = report?.service_request ?? null;
  const preventive = report?.preventive ?? null;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const requiredTasks = tasks.filter((task) => task.is_required).length;
  const completedRequiredTasks = tasks.filter(
    (task) => task.is_required && task.status === "completed"
  ).length;
  const requiredProgressPercent =
    requiredTasks > 0
      ? Math.round((completedRequiredTasks / requiredTasks) * 100)
      : getRequiredTasksProgressPercent(workOrder);
  const requiredTasksReady = requiredTasks === 0 || completedRequiredTasks >= requiredTasks;

  const detailsEditable = canEditWorkOrderDetails(workOrder.status);
  const planningEditable = canEditPlanning(workOrder.status);
  const taskStructureEditable = canEditTaskStructure(workOrder.status);
  const taskResponseFillable = canFillTaskResponses(workOrder.status);
  const requiredFieldClassName = (missingRequiredValue: boolean) =>
    missingRequiredValue ? styles.requiredMissing : undefined;

  function togglePlanningSupportUser(userId: string) {
    setPlanningSupportUserIds((current) =>
      current.includes(userId)
        ? current.filter((selectedUserId) => selectedUserId !== userId)
        : [...current, userId]
    );
  }

  async function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onUpdateDetails({
      workOrderId: workOrder.id,
      title: detailsTitle,
      description: detailsDescription.trim() || null,
      priority: detailsPriority,
      maintenanceType: detailsMaintenanceType,
      reason: detailsReason.trim() || null,
    });

    setEditingDetails(false);
    setDetailsReason("");
  }

  async function handlePlanningSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supportUserIds = planningSupportUserIds.filter(
      (userId) => userId !== planningPrimaryUserId
    );

    await onUpdatePlanning({
      workOrderId: workOrder.id,
      primaryUserId: planningPrimaryUserId,
      supportUserIds,
      scheduledStartAt: toIsoFromLocalInput(planningStartAt),
      scheduledEndAt: toIsoFromLocalInput(planningEndAt),
      estimatedDurationMinutes: planningEstimatedMinutes,
      note: planningReason.trim() || null,
    });

    setEditingPlanning(false);
    setPlanningReason("");
  }

  function updateTaskDraft(
    taskId: string,
    field: keyof TaskCompletionDraft,
    value: string
  ) {
    setTaskDrafts((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? createEmptyTaskDraft()),
        [field]: value,
      },
    }));
  }

  function getTaskDraft(taskId: string) {
    return taskDrafts[taskId] ?? createEmptyTaskDraft();
  }

  async function handleAddTaskFromDrawer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onAddTask({
      workOrderId: workOrder.id,
      title: taskTitle,
      description: taskDescription.trim() || null,
      responseType: taskResponseType,
      isRequired: taskIsRequired,
      requiresPhoto: taskRequiresPhoto,
      sortOrder: tasks.length + 1,
    });

    setTaskTitle("");
    setTaskDescription("");
    setTaskResponseType("checkbox");
    setTaskIsRequired(true);
    setTaskRequiresPhoto(false);
  }

  function startEditingTask(task: WorkOrderReportTask) {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
    setEditingTaskDescription(task.description ?? "");
    setEditingTaskResponseType(task.response_type);
    setEditingTaskIsRequired(task.is_required);
    setEditingTaskRequiresPhoto(task.requires_photo);
    setEditingTaskSortOrder(task.sort_order);
    setEditingTaskReason("");
  }

  function cancelEditingTask() {
    setEditingTaskId(null);
    setEditingTaskTitle("");
    setEditingTaskDescription("");
    setEditingTaskResponseType("checkbox");
    setEditingTaskIsRequired(true);
    setEditingTaskRequiresPhoto(false);
    setEditingTaskSortOrder(0);
    setEditingTaskReason("");
  }

  async function handleUpdateTaskFromDrawer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingTaskId) return;

    await onUpdateTask({
      taskId: editingTaskId,
      title: editingTaskTitle,
      description: editingTaskDescription.trim() || null,
      responseType: editingTaskResponseType,
      isRequired: editingTaskIsRequired,
      requiresPhoto: editingTaskRequiresPhoto,
      sortOrder: editingTaskSortOrder,
      reason: editingTaskReason.trim() || null,
    });

    cancelEditingTask();
  }

  async function handleDeleteTaskFromDrawer(task: WorkOrderReportTask) {
    const confirmed = window.confirm(
      `Excluir a subtarefa "${task.title}"? Esta ação ficará registrada no histórico da OS.`
    );

    if (!confirmed) return;

    await onDeleteTask({
      taskId: task.id,
      reason: "Exclusão manual pelo planejamento da OS.",
    });

    if (editingTaskId === task.id) {
      cancelEditingTask();
    }
  }

  async function handleCompleteTaskFromDrawer(task: WorkOrderReportTask) {
    const draft = getTaskDraft(task.id);

    if (task.response_type === "compliance" && draft.complianceStatus === "not_applicable") {
      await onMarkTaskNotApplicable({
        taskId: task.id,
        reason:
          draft.notApplicableReason.trim() ||
          "Marcado como não aplicável na resposta de conformidade.",
      });
    } else {
      await onCompleteTask(getTaskCompletionPayload(task, draft));
    }

    setTaskDrafts((current) => {
      const next = { ...current };
      delete next[task.id];
      return next;
    });
  }

  async function handleMarkTaskNotApplicableFromDrawer(task: WorkOrderReportTask) {
    const draft = getTaskDraft(task.id);

    await onMarkTaskNotApplicable({
      taskId: task.id,
      reason: draft.notApplicableReason.trim(),
    });

    setTaskDrafts((current) => {
      const next = { ...current };
      delete next[task.id];
      return next;
    });
  }

  async function handleReleaseFromDrawer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onRelease({
      workOrderId: workOrder.id,
      reason: releaseReason.trim() || null,
    });

    setReleaseReason("");
  }

  async function handleReopenRejectedFromDrawer() {
    await onReopenRejected({
      workOrderId: workOrder.id,
      reason: "Reabertura para replanejamento após reprovação.",
    });
  }

  async function handleStartExecutionFromDrawer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onStartExecution({
      workOrderId: workOrder.id,
      reason: startReason.trim() || null,
    });

    setStartReason("");
  }

  async function handleFinishParticipationFromDrawer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onFinishParticipation({
      workOrderId: workOrder.id,
      reason: finishParticipationReason.trim() || null,
    });

    setFinishParticipationReason("");
  }

  async function handleFinishWorkOrderFromDrawer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onFinishWorkOrder({
      workOrderId: workOrder.id,
      executionDescription,
      identifiedCause,
      solutionApplied,
      result: finalResult,
      materialsUsed: materialsUsed.trim() || null,
      internalNotes: internalNotes.trim() || null,
      sendToValidation: true,
    });
  }

  async function handleValidateWorkOrderFromDrawer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onValidate({
      workOrderId: workOrder.id,
      validationResult,
      rejectionReason: validationResult === "rejected" ? rejectionReason.trim() : null,
      comment: validationComment.trim() || null,
    });

    setValidationComment("");
    setRejectionReason("");
  }


  function renderWorkOrderActions() {
    if (workOrder.status === "planned") {
      return (
        <form className={styles.inlineForm} onSubmit={handleReleaseFromDrawer}>
          <div className={styles.formHeader}>
            <strong>Liberar para execução</strong>
            <span>Após liberar, a estrutura das subtarefas fica bloqueada.</span>
          </div>

          <label className={styles.fullField}>
            Observação da liberação
            <input
              value={releaseReason}
              onChange={(event) => setReleaseReason(event.target.value)}
              placeholder="Opcional. Ex.: equipe orientada, materiais separados..."
            />
          </label>

          <div className={styles.formActions}>
            <Button type="submit" variant="primary" loading={releasing}>
              Liberar OS
            </Button>
          </div>
        </form>
      );
    }

    if (workOrder.status === "rejected_by_client") {
      return (
        <div className={styles.inlineForm}>
          <div className={styles.formHeader}>
            <strong>Replanejar OS rejeitada</strong>
            <span>A OS volta para planejamento para ajuste de escopo, equipe ou checklist.</span>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="warning" onClick={handleReopenRejectedFromDrawer}>
              Reabrir planejamento
            </Button>
          </div>
        </div>
      );
    }

    if (["released", "paused", "in_execution"].includes(workOrder.status)) {
      return (
        <div className={styles.actionStack}>
          {!currentUserHasOpenTimeLog && workOrder.status !== "in_execution" && (
            <form className={styles.inlineForm} onSubmit={handleStartExecutionFromDrawer}>
              <div className={styles.formHeader}>
                <strong>Apontamento de execução</strong>
                <span>Use para iniciar ou retomar sua participação na OS.</span>
              </div>

              <label className={styles.fullField}>
                Observação de início/retomada
                <input
                  value={startReason}
                  onChange={(event) => setStartReason(event.target.value)}
                  placeholder="Opcional."
                />
              </label>

              <div className={styles.formActions}>
                <Button type="submit" variant="primary" loading={startingExecution}>
                  {workOrder.status === "paused" ? "Retomar execução" : "Iniciar execução"}
                </Button>
              </div>
            </form>
          )}

          {currentUserHasOpenTimeLog && (
            <form className={styles.inlineForm} onSubmit={handleFinishParticipationFromDrawer}>
              <div className={styles.formHeader}>
                <strong>Finalizar minha participação</strong>
                <span>Encerre seu apontamento aberto antes de finalizar a OS.</span>
              </div>

              <label className={styles.fullField}>
                Observação da participação
                <input
                  value={finishParticipationReason}
                  onChange={(event) => setFinishParticipationReason(event.target.value)}
                  placeholder="Opcional."
                />
              </label>

              <div className={styles.formActions}>
                <Button type="submit" variant="secondary" loading={finishingParticipation}>
                  Finalizar participação
                </Button>
              </div>
            </form>
          )}

          {workOrder.status === "in_execution" && !currentUserHasOpenTimeLog && !requiredTasksReady && (
            <div className={styles.inlineNotice}>
              Preencha as subtarefas obrigatórias na aba Subtarefas. A finalização da OS será liberada somente depois que não houver apontamentos abertos e o checklist obrigatório estiver completo.
            </div>
          )}
        </div>
      );
    }

    if (workOrder.status === "waiting_validation") {
      return (
        <form className={styles.inlineForm} onSubmit={handleValidateWorkOrderFromDrawer}>
          <div className={styles.formHeader}>
            <strong>Validação da OS</strong>
            <span>Aprove ou reprove o serviço executado.</span>
          </div>

          <label>
            Resultado
            <select
              value={validationResult}
              onChange={(event) => setValidationResult(event.target.value as WorkOrderValidationResult)}
            >
              <option value="approved">Aprovar</option>
              <option value="rejected">Reprovar</option>
            </select>
          </label>

          {validationResult === "rejected" && (
            <label className={styles.fullField}>
              Motivo da reprovação
              <textarea
                className={requiredFieldClassName(isBlank(rejectionReason))}
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={3}
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
            />
          </label>

          <div className={styles.formActions}>
            <Button type="submit" variant={validationResult === "approved" ? "success" : "danger"} loading={validating}>
              {validationResult === "approved" ? "Aprovar OS" : "Reprovar OS"}
            </Button>
          </div>
        </form>
      );
    }

    return (
      <p className={styles.muted}>
        Nenhuma ação operacional disponível para este status.
      </p>
    );
  }

  function renderFinishOrderForm() {
    if (!["released", "in_execution", "paused"].includes(workOrder.status)) {
      return null;
    }

    if (hasOpenTimeLogs) {
      return (
        <div className={styles.inlineNotice}>
          Finalize as participações/apontamentos abertos antes de fechar a OS.
        </div>
      );
    }

    if (!requiredTasksReady) {
      return (
        <div className={styles.inlineNotice}>
          Finalize as subtarefas obrigatórias antes de fechar a OS.
        </div>
      );
    }

    return (
      <form className={styles.inlineForm} onSubmit={handleFinishWorkOrderFromDrawer}>
        <div className={styles.formHeader}>
          <strong>Finalizar OS</strong>
          <span>Preencha o que foi executado antes de enviar para validação ou fechamento.</span>
        </div>

        <label className={styles.fullField}>
          Descrição da execução
          <textarea
            className={requiredFieldClassName(isBlank(executionDescription))}
            value={executionDescription}
            onChange={(event) => setExecutionDescription(event.target.value)}
            rows={3}
            required
          />
        </label>

        <label className={styles.fullField}>
          Causa identificada
          <textarea
            value={identifiedCause}
            onChange={(event) => setIdentifiedCause(event.target.value)}
            rows={2}
          />
        </label>

        <label className={styles.fullField}>
          Solução aplicada
          <textarea
            value={solutionApplied}
            onChange={(event) => setSolutionApplied(event.target.value)}
            rows={2}
          />
        </label>

        <label>
          Resultado
          <select
            value={finalResult}
            onChange={(event) => setFinalResult(event.target.value as FinalResult)}
          >
            {Object.entries(finalResultLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.fullField}>
          Materiais utilizados
          <textarea
            value={materialsUsed}
            onChange={(event) => setMaterialsUsed(event.target.value)}
            rows={2}
          />
        </label>

        <label className={styles.fullField}>
          Observações internas
          <textarea
            value={internalNotes}
            onChange={(event) => setInternalNotes(event.target.value)}
            rows={2}
          />
        </label>

        <div className={styles.formActions}>
          <Button type="submit" variant="success" loading={finishingOrder}>
            Finalizar OS
          </Button>
        </div>
      </form>
    );
  }

  function renderTaskResponseField(task: WorkOrderReportTask) {
    const draft = getTaskDraft(task.id);

    if (task.response_type === "text") {
      return (
        <label className={styles.fullField}>
          Resposta
          <textarea
            className={requiredFieldClassName(task.is_required && isBlank(draft.answerText))}
            value={draft.answerText}
            onChange={(event) =>
              updateTaskDraft(task.id, "answerText", event.target.value)
            }
            rows={2}
            placeholder="Descreva a resposta da subtarefa."
            required={task.is_required}
          />
        </label>
      );
    }

    if (task.response_type === "number") {
      return (
        <label>
          Valor numérico
          <input
            className={requiredFieldClassName(task.is_required && isBlank(draft.answerNumber))}
            type="number"
            value={draft.answerNumber}
            onChange={(event) =>
              updateTaskDraft(task.id, "answerNumber", event.target.value)
            }
            required={task.is_required}
          />
        </label>
      );
    }

    if (task.response_type === "boolean") {
      return (
        <label>
          Resposta
          <select
            value={draft.answerBoolean}
            onChange={(event) =>
              updateTaskDraft(task.id, "answerBoolean", event.target.value)
            }
          >
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </label>
      );
    }

    if (task.response_type === "compliance") {
      return (
        <label>
          Resultado de conformidade
          <select
            value={draft.complianceStatus}
            onChange={(event) =>
              updateTaskDraft(task.id, "complianceStatus", event.target.value)
            }
          >
            <option value="conforme">Conforme</option>
            <option value="nao_conforme">Não conforme</option>
            <option value="nao_conforme_corrigido">Não conforme corrigido</option>
            <option value="not_applicable">Não aplicável</option>
          </select>
        </label>
      );
    }

    if (task.response_type === "photo") {
      return (
        <p className={styles.muted}>
          Esta subtarefa exige evidência. A conclusão confirma a etapa, e o anexo pode ser registrado na área de evidências.
        </p>
      );
    }

    return null;
  }

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes da OS ${workOrder.work_order_code}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
<DrawerHeader workOrder={workOrder} onClose={onClose} />

        <div className={styles.statusRow}>
          <span className={`${styles.pill} ${styles[workOrder.status]}`}>
            {statusLabels[workOrder.status]}
          </span>
          <span className={`${styles.pill} ${styles[workOrder.priority]}`}>
            {priorityLabels[workOrder.priority]}
          </span>
          <span className={styles.pill}>
            {maintenanceTypeLabels[workOrder.maintenance_type]}
          </span>
          <span className={styles.pill}>{workOrder.schedule_health}</span>
        </div>

<DrawerTabs tabs={drawerTabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {loading && <div className={styles.loading}>Carregando detalhes completos...</div>}

        <div className={styles.content}>
          {activeTab === "overview" && (
            <OverviewTab
              workOrder={workOrder}
              assignments={assignments}
              tasks={tasks}
              attachments={attachments}
              completedTasks={completedTasks}
              requiredTasks={requiredTasks}
              completedRequiredTasks={completedRequiredTasks}
              requiredProgressPercent={requiredProgressPercent}
              detailsEditable={detailsEditable}
              planningEditable={planningEditable}
              editingDetails={editingDetails}
              setEditingDetails={setEditingDetails}
              editingPlanning={editingPlanning}
              setEditingPlanning={setEditingPlanning}
              detailsTitle={detailsTitle}
              setDetailsTitle={setDetailsTitle}
              detailsDescription={detailsDescription}
              setDetailsDescription={setDetailsDescription}
              detailsPriority={detailsPriority}
              setDetailsPriority={setDetailsPriority}
              detailsMaintenanceType={detailsMaintenanceType}
              setDetailsMaintenanceType={setDetailsMaintenanceType}
              detailsReason={detailsReason}
              setDetailsReason={setDetailsReason}
              savingDetails={savingDetails}
              handleDetailsSubmit={handleDetailsSubmit}
              members={members}
              technicianMembers={technicianMembers}
              loadingMembers={loadingMembers}
              savingPlanning={savingPlanning}
              planningPrimaryUserId={planningPrimaryUserId}
              setPlanningPrimaryUserId={setPlanningPrimaryUserId}
              planningSupportUserIds={planningSupportUserIds}
              setPlanningSupportUserIds={setPlanningSupportUserIds}
              togglePlanningSupportUser={togglePlanningSupportUser}
              planningStartAt={planningStartAt}
              setPlanningStartAt={setPlanningStartAt}
              planningEndAt={planningEndAt}
              setPlanningEndAt={setPlanningEndAt}
              planningEstimatedMinutes={planningEstimatedMinutes}
              setPlanningEstimatedMinutes={setPlanningEstimatedMinutes}
              planningReason={planningReason}
              setPlanningReason={setPlanningReason}
              handlePlanningSubmit={handlePlanningSubmit}
              requiredFieldClassName={requiredFieldClassName}
            />
          )}

          {activeTab === "request" && (
            <RequestTab
              workOrder={workOrder}
              serviceRequest={serviceRequest}
              preventive={preventive}
              history={history}
              renderHistoryDetails={renderHistoryDetails}
            />
          )}

          {activeTab === "tasks" && (
            <TasksTab
              workOrder={workOrder}
              tasks={tasks}
              completedRequiredTasks={completedRequiredTasks}
              requiredTasks={requiredTasks}
              requiredProgressPercent={requiredProgressPercent}
              taskStructureEditable={taskStructureEditable}
              taskResponseFillable={taskResponseFillable}
              applyingStandardTasks={applyingStandardTasks}
              savingTaskStructure={savingTaskStructure}
              completingTaskId={completingTaskId}
              markingTaskNotApplicableId={markingTaskNotApplicableId}
              updatingTaskId={updatingTaskId}
              deletingTaskId={deletingTaskId}
              taskTitle={taskTitle}
              setTaskTitle={setTaskTitle}
              taskDescription={taskDescription}
              setTaskDescription={setTaskDescription}
              taskResponseType={taskResponseType}
              setTaskResponseType={setTaskResponseType}
              taskIsRequired={taskIsRequired}
              setTaskIsRequired={setTaskIsRequired}
              taskRequiresPhoto={taskRequiresPhoto}
              setTaskRequiresPhoto={setTaskRequiresPhoto}
              editingTaskId={editingTaskId}
              editingTaskTitle={editingTaskTitle}
              setEditingTaskTitle={setEditingTaskTitle}
              editingTaskDescription={editingTaskDescription}
              setEditingTaskDescription={setEditingTaskDescription}
              editingTaskResponseType={editingTaskResponseType}
              setEditingTaskResponseType={setEditingTaskResponseType}
              editingTaskIsRequired={editingTaskIsRequired}
              setEditingTaskIsRequired={setEditingTaskIsRequired}
              editingTaskRequiresPhoto={editingTaskRequiresPhoto}
              setEditingTaskRequiresPhoto={setEditingTaskRequiresPhoto}
              editingTaskSortOrder={editingTaskSortOrder}
              setEditingTaskSortOrder={setEditingTaskSortOrder}
              editingTaskReason={editingTaskReason}
              setEditingTaskReason={setEditingTaskReason}
              requiredFieldClassName={requiredFieldClassName}
              getTaskDraft={getTaskDraft}
              updateTaskDraft={updateTaskDraft}
              renderTaskResponseField={renderTaskResponseField}
              onApplyStandardTasks={onApplyStandardTasks}
              handleAddTaskFromDrawer={handleAddTaskFromDrawer}
              handleUpdateTaskFromDrawer={handleUpdateTaskFromDrawer}
              startEditingTask={startEditingTask}
              cancelEditingTask={cancelEditingTask}
              handleDeleteTaskFromDrawer={handleDeleteTaskFromDrawer}
              handleCompleteTaskFromDrawer={handleCompleteTaskFromDrawer}
              handleMarkTaskNotApplicableFromDrawer={handleMarkTaskNotApplicableFromDrawer}
            />
          )}

          {activeTab === "execution" && (
            <ExecutionTab
              workOrder={workOrder}
              report={report}
              attachments={attachments}
              validations={validations}
              actionsContent={renderWorkOrderActions()}
              finishOrderForm={renderFinishOrderForm()}
            />
          )}
        </div>

        <footer className={styles.footer}>
          <span>
            <Timer size={15} />
            {formatMinutes(workOrder.total_labor_minutes)} apontado
          </span>
          <span>
            <ListChecks size={15} />
            {requiredProgressPercent}% checklist
          </span>
          {workOrder.status === "rejected_by_client" && (
            <span>
              <AlertTriangle size={15} />
              Rejeitada para ajuste
            </span>
          )}
          {workOrder.closed_at && (
            <span>
              <CheckCircle2 size={15} />
              Fechada em {formatDateTime(workOrder.closed_at)}
            </span>
          )}
        </footer>
      </aside>
    </div>
  );
}
