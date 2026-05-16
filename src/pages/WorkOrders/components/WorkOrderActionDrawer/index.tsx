import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  PlayCircle,
  RotateCcw,
  X,
} from "lucide-react";

import { Button } from "../../../../components/Button";
import type { WorkspaceOperationalMember } from "../../../../services/workspaceMemberService";
import type {
  FinalResult,
  FinishWorkOrderInput,
  FinishWorkOrderParticipationInput,
  PlanWorkOrderInput,
  ReleaseWorkOrderInput,
  ReopenRejectedWorkOrderInput,
  StartWorkOrderParticipationInput,
  ValidateWorkOrderInput,
  WorkOrderListItem,
  WorkOrderValidationResult,
} from "../../../../types/workOrder";
import {
  finalResultLabels,
  priorityLabels,
  statusLabels,
} from "../../constants/workOrderLabels";
import { formatDateTime } from "../../utils/workOrderFormatters";
import type { WorkOrderQuickAction } from "../../utils/workOrderQuickActions";
import styles from "./styles.module.css";

type WorkOrderActionDrawerProps = {
  workOrder: WorkOrderListItem | null;
  action: WorkOrderQuickAction | null;
  members: WorkspaceOperationalMember[];
  loadingMembers: boolean;
  savingPlanning: boolean;
  releasing: boolean;
  startingExecution: boolean;
  finishingParticipation: boolean;
  validating: boolean;
  reopeningRejected: boolean;
  finishingOrder: boolean;
  onClose: () => void;
  onOpenDetails: (workOrder: WorkOrderListItem) => void;
  onPlan: (input: PlanWorkOrderInput) => Promise<void>;
  onRelease: (input: ReleaseWorkOrderInput) => Promise<void>;
  onStartExecution: (input: StartWorkOrderParticipationInput) => Promise<void>;
  onFinishParticipation: (input: FinishWorkOrderParticipationInput) => Promise<void>;
  onValidate: (input: ValidateWorkOrderInput) => Promise<void>;
  onReopenRejected: (input: ReopenRejectedWorkOrderInput) => Promise<void>;
  onFinishWorkOrder: (input: FinishWorkOrderInput) => Promise<void>;
};

const roleLabels: Record<WorkspaceOperationalMember["role"], string> = {
  admin: "Admin",
  manager: "Gestor",
  planner: "Planejador",
  technician: "Técnico",
  client: "Cliente",
};

function getMemberLabel(member: WorkspaceOperationalMember) {
  const name = member.fullName?.trim() || member.email || "Usuário sem nome";
  return `${name} · ${roleLabels[member.role]}`;
}

function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toIsoFromLocalInput(value: string) {
  return new Date(value).toISOString();
}

function getDefaultEndDateTime(startValue: string, estimatedMinutes: number | null) {
  if (!startValue) return "";

  const startDate = new Date(startValue);
  if (Number.isNaN(startDate.getTime())) return "";

  startDate.setMinutes(startDate.getMinutes() + (estimatedMinutes || 60));

  const timezoneOffset = startDate.getTimezoneOffset() * 60_000;
  return new Date(startDate.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function getActionTitle(action: WorkOrderQuickAction | null) {
  if (action === "plan") return "Programar OS";
  if (action === "release") return "Liberar OS";
  if (action === "execute") return "Executar OS";
  if (action === "finish_participation") return "Finalizar participação";
  if (action === "validate") return "Validar OS";
  if (action === "replan") return "Replanejar OS";
  if (action === "finish") return "Finalizar OS";
  return "Ação rápida";
}

function getActionIcon(action: WorkOrderQuickAction | null) {
  if (action === "plan") return <CalendarClock size={20} />;
  if (action === "release") return <CheckCircle2 size={20} />;
  if (action === "execute") return <PlayCircle size={20} />;
  if (action === "finish_participation") return <CheckCircle2 size={20} />;
  if (action === "validate") return <ClipboardCheck size={20} />;
  if (action === "replan") return <RotateCcw size={20} />;
  if (action === "finish") return <Flag size={20} />;
  return <CalendarClock size={20} />;
}

export function WorkOrderActionDrawer({
  workOrder,
  action,
  members,
  loadingMembers,
  savingPlanning,
  releasing,
  startingExecution,
  finishingParticipation,
  validating,
  reopeningRejected,
  finishingOrder,
  onClose,
  onOpenDetails,
  onPlan,
  onRelease,
  onStartExecution,
  onFinishParticipation,
  onValidate,
  onReopenRejected,
  onFinishWorkOrder,
}: WorkOrderActionDrawerProps) {
  const [primaryUserId, setPrimaryUserId] = useState("");
  const [supportUserIds, setSupportUserIds] = useState<string[]>([]);
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [scheduledEndAt, setScheduledEndAt] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [planningNote, setPlanningNote] = useState("");

  const [releaseReason, setReleaseReason] = useState("");
  const [executionReason, setExecutionReason] = useState("");
  const [finishParticipationReason, setFinishParticipationReason] = useState("");
  const [validationResult, setValidationResult] =
    useState<WorkOrderValidationResult>("approved");
  const [validationComment, setValidationComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [executionDescription, setExecutionDescription] = useState("");
  const [identifiedCause, setIdentifiedCause] = useState("");
  const [solutionApplied, setSolutionApplied] = useState("");
  const [finalResult, setFinalResult] = useState<FinalResult>("resolved");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const technicianMembers = useMemo(
    () => members.filter((member) => member.role === "technician"),
    [members]
  );

  useEffect(() => {
    if (!workOrder) return;

    const start =
      toLocalDateTimeInput(workOrder.scheduled_start_at) ||
      toLocalDateTimeInput(workOrder.calculated_due_at) ||
      "";
    const estimated = workOrder.estimated_duration_minutes ?? 60;

    setPrimaryUserId(workOrder.primary_user_id ?? "");
    setSupportUserIds([]);
    setScheduledStartAt(start);
    setScheduledEndAt(
      toLocalDateTimeInput(workOrder.scheduled_end_at) ||
        getDefaultEndDateTime(start, estimated)
    );
    setEstimatedMinutes(estimated);
    setPlanningNote("");
    setReleaseReason("");
    setExecutionReason("");
    setFinishParticipationReason("");
    setValidationResult("approved");
    setValidationComment("");
    setRejectionReason("");
    setExecutionDescription(workOrder.execution_description ?? "");
    setIdentifiedCause(workOrder.identified_cause ?? "");
    setSolutionApplied(workOrder.solution_applied ?? "");
    setFinalResult(workOrder.result ?? "resolved");
    setMaterialsUsed("");
    setInternalNotes("");
  }, [workOrder?.id, action]);

  if (!workOrder || !action) return null;

  const requiredProgress = Math.max(
    0,
    Math.min(100, Number(workOrder.required_tasks_progress_percent ?? 0))
  );
  const hasOpenTimeLogs = (workOrder.open_time_logs_count ?? 0) > 0;
  const canFinishOrder = requiredProgress >= 100 && !hasOpenTimeLogs;

  function toggleSupportUser(userId: string) {
    setSupportUserIds((current) =>
      current.includes(userId)
        ? current.filter((currentUserId) => currentUserId !== userId)
        : [...current, userId]
    );
  }

  async function handlePlanSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workOrder) return;

    if (action === "replan") {
      await onReopenRejected({
        workOrderId: workOrder.id,
        reason:
          planningNote.trim() ||
          "Replanejamento após reprovação da OS.",
      });
    }

    await onPlan({
      workOrderId: workOrder.id,
      primaryUserId,
      supportUserIds,
      scheduledStartAt: toIsoFromLocalInput(scheduledStartAt),
      scheduledEndAt: toIsoFromLocalInput(scheduledEndAt),
      estimatedDurationMinutes: estimatedMinutes,
      note: planningNote.trim() || null,
    });

    onClose();
  }

  async function handleReleaseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onRelease({
      workOrderId: workOrder.id,
      reason: releaseReason.trim() || null,
    });

    onClose();
  }

  async function handleExecutionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onStartExecution({
      workOrderId: workOrder.id,
      reason: executionReason.trim() || null,
    });

    onClose();
  }

  async function handleFinishParticipationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onFinishParticipation({
      workOrderId: workOrder.id,
      reason: finishParticipationReason.trim() || null,
    });

    onClose();
  }

  async function handleValidateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onValidate({
      workOrderId: workOrder.id,
      validationResult,
      rejectionReason:
        validationResult === "rejected" ? rejectionReason.trim() : null,
      comment: validationComment.trim() || null,
    });

    onClose();
  }

  async function handleFinishSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canFinishOrder) return;

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

    onClose();
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-order-action-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.icon}>{getActionIcon(action)}</span>
            <div>
              <span className={styles.code}>{workOrder.work_order_code}</span>
              <h2 id="work-order-action-title">{getActionTitle(action)}</h2>
              <p>{workOrder.title}</p>
            </div>
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </header>

        <div className={styles.statusSummary}>
          <span>{statusLabels[workOrder.status]}</span>
          <span>{priorityLabels[workOrder.priority]}</span>
          <span>{workOrder.asset_code} · {workOrder.asset_name}</span>
        </div>

        <main className={styles.content}>
          {(action === "plan" || action === "replan") && (
            <form className={styles.form} onSubmit={handlePlanSubmit}>
              <p className={styles.helperText}>
                {action === "replan"
                  ? "Revise responsável, equipe, datas e estimativa antes de liberar novamente."
                  : "Defina responsável, equipe de apoio e programação da OS."}
              </p>

              <label className={styles.fullField}>
                Responsável principal
                <select
                  value={primaryUserId}
                  onChange={(event) => setPrimaryUserId(event.target.value)}
                  required
                  disabled={loadingMembers}
                >
                  <option value="">Selecione o responsável</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {getMemberLabel(member)}
                    </option>
                  ))}
                </select>
              </label>

              <div className={styles.fullField}>
                <span className={styles.labelText}>Equipe de apoio</span>
                <div className={styles.checkList}>
                  {technicianMembers.length === 0 ? (
                    <span className={styles.emptyText}>Nenhum técnico ativo encontrado.</span>
                  ) : (
                    technicianMembers.map((member) => (
                      <label key={member.userId} className={styles.checkItem}>
                        <input
                          type="checkbox"
                          checked={supportUserIds.includes(member.userId)}
                          disabled={member.userId === primaryUserId}
                          onChange={() => toggleSupportUser(member.userId)}
                        />
                        {getMemberLabel(member)}
                      </label>
                    ))
                  )}
                </div>
              </div>

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
                Tempo estimado em minutos
                <input
                  type="number"
                  min={1}
                  value={estimatedMinutes}
                  onChange={(event) => setEstimatedMinutes(Number(event.target.value))}
                  required
                />
              </label>

              <label className={styles.fullField}>
                Observação / motivo
                <textarea
                  value={planningNote}
                  onChange={(event) => setPlanningNote(event.target.value)}
                  rows={3}
                />
              </label>

              <footer className={styles.footer}>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" loading={action === "replan" ? savingPlanning || reopeningRejected : savingPlanning}>
                  {action === "replan" ? "Salvar replanejamento" : "Salvar programação"}
                </Button>
              </footer>
            </form>
          )}

          {action === "release" && (
            <form className={styles.form} onSubmit={handleReleaseSubmit}>
              <p className={styles.helperText}>
                Confirme a liberação da OS para execução. Depois disso, a estrutura do checklist não deve mais ser alterada.
              </p>

              <div className={styles.infoBox}>
                <strong>Programado</strong>
                <span>{formatDateTime(workOrder.scheduled_start_at)}</span>
                <strong>Responsável</strong>
                <span>{workOrder.primary_user_name || "Não definido"}</span>
              </div>

              <label className={styles.fullField}>
                Observação da liberação
                <textarea
                  value={releaseReason}
                  onChange={(event) => setReleaseReason(event.target.value)}
                  rows={3}
                />
              </label>

              <footer className={styles.footer}>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" loading={releasing}>
                  Liberar OS
                </Button>
              </footer>
            </form>
          )}

          {action === "execute" && (
            <form className={styles.form} onSubmit={handleExecutionSubmit}>
              <p className={styles.helperText}>
                Inicie ou retome sua participação na OS. Depois, preencha as subtarefas no detalhe da OS.
              </p>

              <label className={styles.fullField}>
                Observação de início/retomada
                <textarea
                  value={executionReason}
                  onChange={(event) => setExecutionReason(event.target.value)}
                  rows={3}
                />
              </label>

              <footer className={styles.footer}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenDetails(workOrder)}
                >
                  Abrir detalhe
                </Button>
                <Button type="submit" loading={startingExecution}>
                  Iniciar / retomar
                </Button>
              </footer>
            </form>
          )}

          {action === "finish_participation" && (
            <form className={styles.form} onSubmit={handleFinishParticipationSubmit}>
              <p className={styles.helperText}>
                Antes de finalizar a OS, encerre sua participação/apontamento aberto.
              </p>

              <label className={styles.fullField}>
                Observação da participação
                <textarea
                  value={finishParticipationReason}
                  onChange={(event) => setFinishParticipationReason(event.target.value)}
                  rows={3}
                  placeholder="Opcional."
                />
              </label>

              <footer className={styles.footer}>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" loading={finishingParticipation}>
                  Finalizar participação
                </Button>
              </footer>
            </form>
          )}

          {action === "validate" && (
            <form className={styles.form} onSubmit={handleValidateSubmit}>
              <p className={styles.helperText}>
                Valide a OS concluída. Para reprovar, informe obrigatoriamente o motivo.
              </p>

              <label>
                Resultado
                <select
                  value={validationResult}
                  onChange={(event) =>
                    setValidationResult(event.target.value as WorkOrderValidationResult)
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

              <footer className={styles.footer}>
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" loading={validating}>
                  Salvar validação
                </Button>
              </footer>
            </form>
          )}

          {action === "finish" && (
            hasOpenTimeLogs ? (
              <div className={styles.infoBox}>
                <strong>Existem apontamentos abertos</strong>
                <span>Finalize as participações abertas antes de finalizar a OS.</span>
              </div>
            ) : requiredProgress < 100 ? (
              <div className={styles.infoBox}>
                <strong>Checklist obrigatório pendente</strong>
                <span>Conclua todas as subtarefas obrigatórias antes de finalizar a OS.</span>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleFinishSubmit}>
                <p className={styles.helperText}>
                  Todas as subtarefas obrigatórias foram concluídas e não há apontamentos abertos. Preencha o fechamento para enviar a OS para validação ou encerramento.
                </p>

                <label className={styles.fullField}>
                  Descrição da execução
                  <textarea
                    value={executionDescription}
                    onChange={(event) => setExecutionDescription(event.target.value)}
                    rows={4}
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

                <footer className={styles.footer}>
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="success" loading={finishingOrder}>
                    Finalizar OS
                  </Button>
                </footer>
              </form>
            )
          )}
        </main>
      </aside>
    </div>
  );
}
