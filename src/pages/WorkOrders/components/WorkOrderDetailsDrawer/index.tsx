import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  History,
  ListChecks,
  MapPin,
  Paperclip,
  Save,
  Timer,
  UserRound,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";

import { Button } from "../../../../components/Button";
import type { WorkspaceOperationalMember } from "../../../../services/workspaceMemberService";
import type {
  FinalResult,
  MaintenanceType,
  PlanWorkOrderInput,
  PriorityLevel,
  UpdateWorkOrderDetailsInput,
  WorkOrderListItem,
  WorkOrderReport,
  WorkOrderReportHistory,
  WorkOrderReportTask,
  WorkOrderValidationResult,
} from "../../../../types/workOrder";
import {
  finalResultLabels,
  maintenanceTypeLabels,
  priorityLabels,
  responseTypeLabels,
  statusLabels,
  validationResultLabels,
} from "../../constants/workOrderLabels";
import { formatDateTime, formatMinutes } from "../../utils/workOrderFormatters";
import {
  canEditPlanning,
  canEditWorkOrderDetails,
} from "../../utils/workOrderPermissions";
import styles from "./styles.module.css";

type WorkOrderDetailsDrawerProps = {
  workOrder: WorkOrderListItem | null;
  report: WorkOrderReport | null;
  loading: boolean;
  members: WorkspaceOperationalMember[];
  loadingMembers: boolean;
  savingDetails: boolean;
  savingPlanning: boolean;
  onClose: () => void;
  onUpdateDetails: (input: UpdateWorkOrderDetailsInput) => Promise<void>;
  onUpdatePlanning: (input: PlanWorkOrderInput) => Promise<void>;
};

type DrawerTab = "overview" | "request" | "tasks" | "execution";

type DrawerTabConfig = {
  id: DrawerTab;
  label: string;
};

const drawerTabs: DrawerTabConfig[] = [
  { id: "overview", label: "Resumo" },
  { id: "request", label: "Solicitação" },
  { id: "tasks", label: "Subtarefas" },
  { id: "execution", label: "Execução" },
];

const priorityOptions: PriorityLevel[] = ["low", "medium", "high", "critical"];
const maintenanceTypeOptions: MaintenanceType[] = [
  "corrective",
  "preventive",
  "inspection",
  "improvement",
  "emergency",
];

const roleLabels: Record<WorkspaceOperationalMember["role"], string> = {
  admin: "Admin",
  manager: "Gestor",
  planner: "Planejador",
  technician: "Técnico",
  client: "Cliente",
};

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatBoolean(value: boolean | null | undefined) {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  return "-";
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

function getRequiredTasksProgressPercent(workOrder: WorkOrderListItem) {
  const progressPercent = Number(workOrder.required_tasks_progress_percent ?? 0);

  if (Number.isNaN(progressPercent)) return 0;

  return Math.max(0, Math.min(100, Math.round(progressPercent)));
}

function getOriginLabel(workOrder: WorkOrderListItem) {
  if (workOrder.origin === "service_request") {
    return workOrder.service_request_code
      ? `Chamado ${workOrder.service_request_code}`
      : "Chamado";
  }

  if (workOrder.origin === "preventive_plan") {
    return workOrder.preventive_plan_name
      ? `Preventiva · ${workOrder.preventive_plan_name}`
      : "Preventiva";
  }

  return "Interna";
}

function getTaskStatusLabel(status: WorkOrderReportTask["status"]) {
  if (status === "completed") return "Concluída";
  if (status === "not_applicable") return "Não aplicável";
  return "Pendente";
}

function getValidationResultLabel(result: WorkOrderValidationResult) {
  return validationResultLabels[result] ?? result;
}

function getFinalResultLabel(result: FinalResult | null | undefined) {
  if (!result) return "-";
  return finalResultLabels[result] ?? result;
}

function formatJsonValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getMemberLabel(member: WorkspaceOperationalMember) {
  const name = member.fullName?.trim() || member.email || "Usuário sem nome";
  return `${name} · ${roleLabels[member.role]}`;
}

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
  onClose,
  onUpdateDetails,
  onUpdatePlanning,
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
  }, [workOrder?.id, report?.assignments]);

  const technicianMembers = useMemo(
    () => members.filter((member) => member.role === "technician"),
    [members]
  );

  if (!workOrder) return null;

  const requiredProgressPercent = getRequiredTasksProgressPercent(workOrder);
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

  const detailsEditable = canEditWorkOrderDetails(workOrder.status);
  const planningEditable = canEditPlanning(workOrder.status);

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

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes da OS ${workOrder.work_order_code}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <span className={styles.eyebrow}>{workOrder.work_order_code}</span>
            <h2>{workOrder.title}</h2>
            <p>{getOriginLabel(workOrder)}</p>
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
            Fechar
          </Button>
        </header>

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

        <nav className={styles.tabs} aria-label="Seções da OS">
          {drawerTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? styles.activeTab : styles.tab}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {loading && <div className={styles.loading}>Carregando detalhes completos...</div>}

        <div className={styles.content}>
          {activeTab === "overview" && (
            <div className={styles.tabPanel}>
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>
                    <FileText size={17} />
                    Dados principais
                  </h3>

                  {detailsEditable && !editingDetails && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingDetails(true)}
                    >
                      Editar
                    </Button>
                  )}
                </div>

                {editingDetails ? (
                  <form className={styles.editForm} onSubmit={handleDetailsSubmit}>
                    <label className={styles.fullField}>
                      Título
                      <input
                        value={detailsTitle}
                        onChange={(event) => setDetailsTitle(event.target.value)}
                        required
                      />
                    </label>

                    <label className={styles.fullField}>
                      Descrição
                      <textarea
                        value={detailsDescription}
                        onChange={(event) => setDetailsDescription(event.target.value)}
                        rows={4}
                      />
                    </label>

                    <label>
                      Prioridade
                      <select
                        value={detailsPriority}
                        onChange={(event) =>
                          setDetailsPriority(event.target.value as PriorityLevel)
                        }
                      >
                        {priorityOptions.map((priority) => (
                          <option key={priority} value={priority}>
                            {priorityLabels[priority]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Tipo de manutenção
                      <select
                        value={detailsMaintenanceType}
                        onChange={(event) =>
                          setDetailsMaintenanceType(event.target.value as MaintenanceType)
                        }
                      >
                        {maintenanceTypeOptions.map((maintenanceType) => (
                          <option key={maintenanceType} value={maintenanceType}>
                            {maintenanceTypeLabels[maintenanceType]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.fullField}>
                      Motivo da alteração
                      <textarea
                        value={detailsReason}
                        onChange={(event) => setDetailsReason(event.target.value)}
                        rows={2}
                        placeholder="Ex: ajuste de escopo após revisão do planejamento."
                      />
                    </label>

                    <div className={styles.formActions}>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditingDetails(false)}
                        disabled={savingDetails}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" variant="primary" loading={savingDetails}>
                        <Save size={16} />
                        Salvar dados
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    {!detailsEditable && (
                      <p className={styles.readOnlyNotice}>
                        Dados principais ficam bloqueados após liberação para execução.
                      </p>
                    )}

                    <div className={styles.textBlock}>
                      <span>Descrição da OS</span>
                      <p>{workOrder.description || "Sem descrição."}</p>
                    </div>

                    <div className={styles.infoGrid}>
                      <div>
                        <span>Prioridade</span>
                        <strong>{priorityLabels[workOrder.priority]}</strong>
                      </div>
                      <div>
                        <span>Tipo</span>
                        <strong>{maintenanceTypeLabels[workOrder.maintenance_type]}</strong>
                      </div>
                      <div>
                        <span>Status</span>
                        <strong>{statusLabels[workOrder.status]}</strong>
                      </div>
                      <div>
                        <span>Origem</span>
                        <strong>{getOriginLabel(workOrder)}</strong>
                      </div>
                    </div>
                  </>
                )}
              </section>

              <section className={styles.section}>
                <h3>
                  <MapPin size={17} />
                  Ativo / local
                </h3>

                <div className={styles.infoGrid}>
                  <div>
                    <span>Código</span>
                    <strong>{workOrder.asset_code}</strong>
                  </div>
                  <div>
                    <span>Nome</span>
                    <strong>{workOrder.asset_name}</strong>
                  </div>
                  <div>
                    <span>Tipo</span>
                    <strong>{workOrder.asset_type_name}</strong>
                  </div>
                  <div>
                    <span>Criticidade</span>
                    <strong>{workOrder.asset_criticality}</strong>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>
                    <CalendarClock size={17} />
                    Planejamento / equipe
                  </h3>

                  {planningEditable && !editingPlanning && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingPlanning(true)}
                    >
                      Editar planejamento
                    </Button>
                  )}
                </div>

                {editingPlanning ? (
                  <form className={styles.editForm} onSubmit={handlePlanningSubmit}>
                    <label className={styles.fullField}>
                      Responsável principal
                      <select
                        value={planningPrimaryUserId}
                        onChange={(event) => {
                          const nextPrimaryUserId = event.target.value;
                          setPlanningPrimaryUserId(nextPrimaryUserId);
                          setPlanningSupportUserIds((current) =>
                            current.filter((userId) => userId !== nextPrimaryUserId)
                          );
                        }}
                        disabled={loadingMembers || savingPlanning}
                        required
                      >
                        <option value="">
                          {loadingMembers
                            ? "Carregando membros..."
                            : "Selecione um responsável"}
                        </option>
                        {members.map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {getMemberLabel(member)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <fieldset className={styles.fullField}>
                      <legend>Equipe de apoio</legend>
                      <p className={styles.muted}>
                        Apenas técnicos podem entrar como apoio de execução.
                      </p>

                      {technicianMembers.length > 0 ? (
                        <div className={styles.checkboxGroup}>
                          {technicianMembers.map((member) => (
                            <label key={member.userId} className={styles.checkboxOption}>
                              <input
                                type="checkbox"
                                checked={planningSupportUserIds.includes(member.userId)}
                                disabled={
                                  savingPlanning || member.userId === planningPrimaryUserId
                                }
                                onChange={() => togglePlanningSupportUser(member.userId)}
                              />
                              <span>{getMemberLabel(member)}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.muted}>Nenhum técnico ativo encontrado.</p>
                      )}
                    </fieldset>

                    <label>
                      Início programado
                      <input
                        type="datetime-local"
                        value={planningStartAt}
                        onChange={(event) => setPlanningStartAt(event.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Fim programado
                      <input
                        type="datetime-local"
                        value={planningEndAt}
                        onChange={(event) => setPlanningEndAt(event.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Duração estimada em minutos
                      <input
                        type="number"
                        min={1}
                        value={planningEstimatedMinutes}
                        onChange={(event) =>
                          setPlanningEstimatedMinutes(Number(event.target.value))
                        }
                        required
                      />
                    </label>

                    <label className={styles.fullField}>
                      Motivo / observação
                      <textarea
                        value={planningReason}
                        onChange={(event) => setPlanningReason(event.target.value)}
                        rows={2}
                      />
                    </label>

                    <div className={styles.formActions}>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditingPlanning(false)}
                        disabled={savingPlanning}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" variant="primary" loading={savingPlanning}>
                        <Save size={16} />
                        Salvar planejamento
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    {!planningEditable && (
                      <p className={styles.readOnlyNotice}>
                        Planejamento e equipe ficam bloqueados após liberação.
                      </p>
                    )}

                    <div className={styles.infoGrid}>
                      <div>
                        <span>Responsável</span>
                        <strong>{workOrder.primary_user_name || "Não definido"}</strong>
                      </div>
                      <div>
                        <span>Equipe</span>
                        <strong>{workOrder.assigned_users_count}</strong>
                      </div>
                      <div>
                        <span>Início programado</span>
                        <strong>{formatDateTime(workOrder.scheduled_start_at)}</strong>
                      </div>
                      <div>
                        <span>Fim programado</span>
                        <strong>{formatDateTime(workOrder.scheduled_end_at)}</strong>
                      </div>
                      <div>
                        <span>Prazo calculado</span>
                        <strong>{formatDateTime(workOrder.calculated_due_at)}</strong>
                      </div>
                      <div>
                        <span>Tempo estimado</span>
                        <strong>{formatMinutes(workOrder.estimated_duration_minutes)}</strong>
                      </div>
                    </div>

                    {assignments.length > 0 && (
                      <details className={styles.collapseBlock}>
                        <summary>Ver equipe detalhada</summary>
                        <div className={styles.compactList}>
                          {assignments.map((assignment) => (
                            <div key={assignment.assignment_id} className={styles.compactItem}>
                              <strong>{assignment.user_name || "Usuário sem nome"}</strong>
                              <span>
                                {assignment.is_primary ? "Responsável principal" : "Apoio"} · {assignment.role} · {assignment.status}
                              </span>
                              <span>
                                Estimado: {formatMinutes(assignment.estimated_minutes)} · Apontado: {formatMinutes(assignment.total_minutes)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                )}
              </section>

              <section className={styles.section}>
                <h3>
                  <ListChecks size={17} />
                  Progresso
                </h3>

                <div className={styles.progressCard}>
                  <div>
                    <span>Checklist obrigatório</span>
                    <strong>{requiredProgressPercent}%</strong>
                  </div>
                  <div className={styles.progressSummary}>
                    <div className={styles.progressTrack}>
                      <span style={{ width: `${requiredProgressPercent}%` }} />
                    </div>
                  </div>
                </div>

                <div className={styles.infoGrid}>
                  <div>
                    <span>Obrigatórias</span>
                    <strong>{completedRequiredTasks}/{requiredTasks}</strong>
                  </div>
                  <div>
                    <span>Total concluídas</span>
                    <strong>{completedTasks}/{tasks.length || workOrder.tasks_count}</strong>
                  </div>
                  <div>
                    <span>Horas apontadas</span>
                    <strong>{formatMinutes(workOrder.total_labor_minutes)}</strong>
                  </div>
                  <div>
                    <span>Anexos</span>
                    <strong>{attachments.length || workOrder.attachments_count}</strong>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "request" && (
            <div className={styles.tabPanel}>
              <section className={styles.section}>
                <h3>
                  <ClipboardList size={17} />
                  Solicitação / origem
                </h3>

                <div className={styles.infoGrid}>
                  <div>
                    <span>Origem</span>
                    <strong>{getOriginLabel(workOrder)}</strong>
                  </div>
                  <div>
                    <span>Criada por</span>
                    <strong>{formatValue(workOrder.created_by_name)}</strong>
                  </div>
                  <div>
                    <span>Criada em</span>
                    <strong>{formatDateTime(workOrder.created_at)}</strong>
                  </div>
                  <div>
                    <span>Atualizada em</span>
                    <strong>{formatDateTime(workOrder.updated_at)}</strong>
                  </div>
                </div>
              </section>

              {serviceRequest && (
                <section className={styles.section}>
                  <h3>
                    <FileText size={17} />
                    Chamado de origem
                  </h3>

                  <div className={styles.infoGrid}>
                    <div>
                      <span>Código</span>
                      <strong>{serviceRequest.code}</strong>
                    </div>
                    <div>
                      <span>Solicitante</span>
                      <strong>{formatValue(serviceRequest.opened_by_name)}</strong>
                    </div>
                    <div>
                      <span>Problema padrão</span>
                      <strong>{formatValue(serviceRequest.problem)}</strong>
                    </div>
                    <div>
                      <span>Abertura</span>
                      <strong>{formatDateTime(serviceRequest.created_at)}</strong>
                    </div>
                  </div>

                  <div className={styles.textStack}>
                    {serviceRequest.problem_other_text && (
                      <div className={styles.textBlock}>
                        <span>Complemento / outro problema</span>
                        <p>{serviceRequest.problem_other_text}</p>
                      </div>
                    )}
                    <div className={styles.textBlock}>
                      <span>Descrição original</span>
                      <p>{serviceRequest.description}</p>
                    </div>
                  </div>
                </section>
              )}

              {preventive && (
                <section className={styles.section}>
                  <h3>
                    <Wrench size={17} />
                    Preventiva de origem
                  </h3>

                  <div className={styles.infoGrid}>
                    <div>
                      <span>Plano</span>
                      <strong>{preventive.plan_name}</strong>
                    </div>
                    <div>
                      <span>Tarefa</span>
                      <strong>{preventive.task_name}</strong>
                    </div>
                    <div>
                      <span>Vencimento</span>
                      <strong>{formatDateTime(preventive.due_at)}</strong>
                    </div>
                    <div>
                      <span>Data prevista</span>
                      <strong>{formatValue(preventive.due_date)}</strong>
                    </div>
                  </div>
                </section>
              )}

              {!serviceRequest && !preventive && (
                <section className={styles.section}>
                  <h3>
                    <FileText size={17} />
                    Atividade interna
                  </h3>
                  <div className={styles.textBlock}>
                    <span>Descrição</span>
                    <p>{workOrder.description || "Sem descrição."}</p>
                  </div>
                </section>
              )}

              <section className={styles.section}>
                <h3>
                  <History size={17} />
                  Histórico
                </h3>

                {history.length > 0 ? (
                  <div className={styles.timeline}>
                    {history.map((item) => (
                      <div key={item.id} className={styles.timelineItem}>
                        <strong>{item.action}</strong>
                        <span>
                          {formatValue(item.performed_by_name)} · {formatDateTime(item.created_at)}
                        </span>
                        {item.reason && <small>Motivo: {item.reason}</small>}
                        {renderHistoryDetails(item)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>Nenhum histórico carregado.</p>
                )}
              </section>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className={styles.tabPanel}>
              <section className={styles.section}>
                <h3>
                  <ListChecks size={17} />
                  Subtarefas / checklist
                </h3>

                <div className={styles.progressCard}>
                  <div>
                    <span>Obrigatórias concluídas</span>
                    <strong>{completedRequiredTasks}/{requiredTasks} · {requiredProgressPercent}%</strong>
                  </div>
                  <div className={styles.progressSummary}>
                    <div className={styles.progressTrack}>
                      <span style={{ width: `${requiredProgressPercent}%` }} />
                    </div>
                  </div>
                </div>

                {tasks.length > 0 ? (
                  <div className={styles.compactList}>
                    {tasks.map((task) => (
                      <div key={task.id} className={styles.compactItem}>
                        <div className={styles.itemHeader}>
                          <strong>{task.title}</strong>
                          <span className={`${styles.smallBadge} ${styles[task.status]}`}>
                            {getTaskStatusLabel(task.status)}
                          </span>
                        </div>
                        {task.description && <p>{task.description}</p>}
                        <span>
                          {responseTypeLabels[task.response_type]} · {task.is_required ? "Obrigatória" : "Opcional"} · {task.requires_photo ? "Exige foto" : "Sem foto obrigatória"}
                        </span>
                        <span>
                          Concluída por: {formatValue(task.completed_by_name)} · {formatDateTime(task.completed_at)}
                        </span>
                        {(task.answer_text || task.answer_number !== null || task.answer_boolean !== null || task.compliance_result !== null || task.not_applicable_reason) && (
                          <div className={styles.answerBox}>
                            {task.answer_text && <span>Texto: {task.answer_text}</span>}
                            {task.answer_number !== null && <span>Número: {task.answer_number}</span>}
                            {task.answer_boolean !== null && <span>Sim/Não: {formatBoolean(task.answer_boolean)}</span>}
                            {task.compliance_result !== null && <span>Conformidade: {formatBoolean(task.compliance_result)}</span>}
                            {task.not_applicable_reason && <span>Não aplicável: {task.not_applicable_reason}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>Nenhuma subtarefa detalhada carregada.</p>
                )}
              </section>
            </div>
          )}

          {activeTab === "execution" && (
            <div className={styles.tabPanel}>
              <section className={styles.section}>
                <h3>
                  <Clock3 size={17} />
                  Execução e fechamento
                </h3>

                <div className={styles.infoGrid}>
                  <div>
                    <span>Início real</span>
                    <strong>{formatDateTime(workOrder.actual_started_at)}</strong>
                  </div>
                  <div>
                    <span>Fim real</span>
                    <strong>{formatDateTime(workOrder.actual_finished_at)}</strong>
                  </div>
                  <div>
                    <span>Duração calendário</span>
                    <strong>{formatMinutes(report?.calendar_duration_minutes ?? null)}</strong>
                  </div>
                  <div>
                    <span>Horas apontadas</span>
                    <strong>{formatMinutes(workOrder.total_labor_minutes)}</strong>
                  </div>
                  <div>
                    <span>Resultado</span>
                    <strong>{getFinalResultLabel(workOrder.result)}</strong>
                  </div>
                  <div>
                    <span>Fechada por</span>
                    <strong>{formatValue(workOrder.closed_by_name)}</strong>
                  </div>
                  <div>
                    <span>Fechada em</span>
                    <strong>{formatDateTime(workOrder.closed_at)}</strong>
                  </div>
                  <div>
                    <span>Anexos</span>
                    <strong>{attachments.length || workOrder.attachments_count}</strong>
                  </div>
                </div>

                <div className={styles.textStack}>
                  <div className={styles.textBlock}>
                    <span>Descrição da execução</span>
                    <p>{workOrder.execution_description || "-"}</p>
                  </div>
                  <div className={styles.textBlock}>
                    <span>Causa identificada</span>
                    <p>{workOrder.identified_cause || "-"}</p>
                  </div>
                  <div className={styles.textBlock}>
                    <span>Solução aplicada</span>
                    <p>{workOrder.solution_applied || "-"}</p>
                  </div>
                  <div className={styles.textBlock}>
                    <span>Materiais utilizados</span>
                    <p>{report?.materials_used || "-"}</p>
                  </div>
                  <div className={styles.textBlock}>
                    <span>Observações internas</span>
                    <p>{report?.internal_notes || "-"}</p>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <h3>
                  <Paperclip size={17} />
                  Anexos / evidências
                </h3>

                {attachments.length > 0 ? (
                  <div className={styles.compactList}>
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className={styles.compactItem}>
                        <strong>{attachment.file_name}</strong>
                        <span>
                          {attachment.attachment_type} · {formatValue(attachment.mime_type)} · {formatDateTime(attachment.created_at)}
                        </span>
                        <span>Enviado por: {formatValue(attachment.uploaded_by_name)}</span>
                        {attachment.description && <p>{attachment.description}</p>}
                        <span className={styles.pathText}>{attachment.file_path}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>Nenhum anexo carregado.</p>
                )}
              </section>

              <section className={styles.section}>
                <h3>
                  <BadgeCheck size={17} />
                  Validações
                </h3>

                {validations.length > 0 ? (
                  <div className={styles.compactList}>
                    {validations.map((validation) => (
                      <div key={validation.id} className={styles.compactItem}>
                        <div className={styles.itemHeader}>
                          <strong>{getValidationResultLabel(validation.validation_result)}</strong>
                          <span className={`${styles.smallBadge} ${styles[validation.validation_result]}`}>
                            {validation.validation_type}
                          </span>
                        </div>
                        <span>
                          Por: {formatValue(validation.validated_by_name)} · Em: {formatDateTime(validation.created_at)}
                        </span>
                        {validation.rejection_reason && (
                          <p><strong>Motivo:</strong> {validation.rejection_reason}</p>
                        )}
                        {validation.comment && <p><strong>Comentário:</strong> {validation.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>Nenhuma validação registrada.</p>
                )}
              </section>
            </div>
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
