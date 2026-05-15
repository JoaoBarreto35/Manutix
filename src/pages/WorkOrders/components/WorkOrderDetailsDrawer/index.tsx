import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  History,
  Info,
  ListChecks,
  MapPin,
  Paperclip,
  ShieldCheck,
  Timer,
  UserRound,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";

import { Button } from "../../../../components/Button";
import type {
  FinalResult,
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
import styles from "./styles.module.css";

type WorkOrderDetailsDrawerProps = {
  workOrder: WorkOrderListItem | null;
  report: WorkOrderReport | null;
  loading: boolean;
  onClose: () => void;
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

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatBoolean(value: boolean | null | undefined) {
  if (value === true) {
    return "Sim";
  }

  if (value === false) {
    return "Não";
  }

  return "-";
}

function getRequiredTasksProgressPercent(workOrder: WorkOrderListItem) {
  const progressPercent = Number(workOrder.required_tasks_progress_percent ?? 0);

  if (Number.isNaN(progressPercent)) {
    return 0;
  }

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
  if (status === "completed") {
    return "Concluída";
  }

  if (status === "not_applicable") {
    return "Não aplicável";
  }

  return "Pendente";
}

function getValidationResultLabel(result: WorkOrderValidationResult) {
  return validationResultLabels[result] ?? result;
}

function getFinalResultLabel(result: FinalResult | null | undefined) {
  if (!result) {
    return "-";
  }

  return finalResultLabels[result] ?? result;
}

function formatJsonValue(value: unknown) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function renderHistoryDetails(item: WorkOrderReportHistory) {
  const hasOldValue = item.old_value !== null && item.old_value !== undefined;
  const hasNewValue = item.new_value !== null && item.new_value !== undefined;

  if (!hasOldValue && !hasNewValue) {
    return null;
  }

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
  onClose,
}: WorkOrderDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");

  if (!workOrder) {
    return null;
  }

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
          <span className={styles.pill}>{maintenanceTypeLabels[workOrder.maintenance_type]}</span>
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
                <h3>
                  <FileText size={17} />
                  Visão geral
                </h3>

                <div className={styles.textBlock}>
                  <span>Descrição da OS</span>
                  <p>{workOrder.description || "Sem descrição."}</p>
                </div>

                <div className={styles.infoGrid}>
                  <div>
                    <span>Ativo/local</span>
                    <strong>{workOrder.asset_name}</strong>
                  </div>
                  <div>
                    <span>Tipo do ativo</span>
                    <strong>{workOrder.asset_type_name}</strong>
                  </div>
                  <div>
                    <span>Responsável</span>
                    <strong>{workOrder.primary_user_name || "Não definido"}</strong>
                  </div>
                  <div>
                    <span>Equipe</span>
                    <strong>{workOrder.assigned_users_count}</strong>
                  </div>
                  <div>
                    <span>Programado</span>
                    <strong>{formatDateTime(workOrder.scheduled_start_at)}</strong>
                  </div>
                  <div>
                    <span>Prazo</span>
                    <strong>{formatDateTime(workOrder.calculated_due_at)}</strong>
                  </div>
                  <div>
                    <span>Tempo estimado</span>
                    <strong>{formatMinutes(workOrder.estimated_duration_minutes)}</strong>
                  </div>
                  <div>
                    <span>Horas apontadas</span>
                    <strong>{formatMinutes(workOrder.total_labor_minutes)}</strong>
                  </div>
                </div>

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
                    <span>Natureza</span>
                    <strong>{workOrder.asset_kind}</strong>
                  </div>
                  <div>
                    <span>Criticidade</span>
                    <strong>{workOrder.asset_criticality}</strong>
                  </div>
                  <div>
                    <span>ID do ativo</span>
                    <strong>{workOrder.asset_id}</strong>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <h3>
                  <CalendarClock size={17} />
                  Planejamento
                </h3>

                <div className={styles.infoGrid}>
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
                  <div>
                    <span>Saúde do prazo</span>
                    <strong>{workOrder.schedule_health}</strong>
                  </div>
                  <div>
                    <span>Fonte do prazo</span>
                    <strong>{formatValue(workOrder.due_source)}</strong>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <h3>
                  <UsersRound size={17} />
                  Equipe
                </h3>

                <div className={styles.primaryResponsible}>
                  <UserRound size={16} />
                  <div>
                    <span>Responsável principal</span>
                    <strong>{workOrder.primary_user_name || "Não definido"}</strong>
                  </div>
                </div>

                {assignments.length > 0 ? (
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
                          <span>
                            Início: {formatDateTime(assignment.started_at)} · Fim: {formatDateTime(assignment.finished_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : (
                  <p className={styles.muted}>Nenhuma equipe detalhada carregada.</p>
                )}
              </section>
            </div>
          )}

          {activeTab === "request" && (
            <div className={styles.tabPanel}>
              <section className={styles.section}>
                <h3>
                  <Info size={17} />
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

                <div className={styles.textBlock}>
                  <span>Descrição da OS</span>
                  <p>{workOrder.description || "Sem descrição."}</p>
                </div>
              </section>

              {serviceRequest && (
                <section className={styles.section}>
                  <h3>
                    <ClipboardList size={17} />
                    Chamado de origem
                  </h3>

                  <div className={styles.infoGrid}>
                    <div>
                      <span>Código do chamado</span>
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
                      <span>Aberto em</span>
                      <strong>{formatDateTime(serviceRequest.created_at)}</strong>
                    </div>
                  </div>

                  {serviceRequest.problem_other_text && (
                    <div className={styles.textBlock}>
                      <span>Complemento / outro problema</span>
                      <p>{serviceRequest.problem_other_text}</p>
                    </div>
                  )}

                  <div className={styles.textBlock}>
                    <span>Descrição original do chamado</span>
                    <p>{serviceRequest.description || "Sem descrição do chamado."}</p>
                  </div>
                </section>
              )}

              {preventive && (
                <section className={styles.section}>
                  <h3>
                    <ShieldCheck size={17} />
                    Preventiva de origem
                  </h3>

                  <div className={styles.infoGrid}>
                    <div>
                      <span>Plano</span>
                      <strong>{preventive.plan_name}</strong>
                    </div>
                    <div>
                      <span>Tarefa preventiva</span>
                      <strong>{preventive.task_name}</strong>
                    </div>
                    <div>
                      <span>Vencimento</span>
                      <strong>{formatValue(preventive.due_date)}</strong>
                    </div>
                    <div>
                      <span>Prazo da ocorrência</span>
                      <strong>{formatDateTime(preventive.due_at)}</strong>
                    </div>
                  </div>
                </section>
              )}

              {!serviceRequest && !preventive && (
                <section className={styles.section}>
                  <h3>
                    <Wrench size={17} />
                    Atividade interna
                  </h3>

                  <div className={styles.textBlock}>
                    <span>Contexto</span>
                    <p>
                      Esta OS foi aberta internamente, sem chamado de origem ou plano preventivo vinculado.
                    </p>
                  </div>
                </section>
              )}


              <section className={styles.section}>
                <h3>
                  <History size={17} />
                  Histórico da solicitação/OS
                </h3>

                {history.length > 0 ? (
                  <div className={styles.timeline}>
                    {history.map((item) => (
                      <div key={item.id} className={styles.timelineItem}>
                        <span>{formatDateTime(item.created_at)}</span>
                        <strong>{item.action}</strong>
                        <small>
                          {item.performed_by_name || "Sistema"}
                          {item.reason ? ` · ${item.reason}` : ""}
                        </small>
                        {renderHistoryDetails(item)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>Histórico não carregado ou vazio.</p>
                )}
              </section>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className={styles.tabPanel}>
              <section className={styles.section}>
                <h3>
                  <ClipboardList size={17} />
                  Subtarefas / checklist
                </h3>

                <div className={styles.progressCard}>
                  <div>
                    <span>Obrigatórias concluídas</span>
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
                    <span>Total</span>
                    <strong>{tasks.length || workOrder.tasks_count}</strong>
                  </div>
                  <div>
                    <span>Concluídas</span>
                    <strong>{completedTasks}</strong>
                  </div>
                  <div>
                    <span>Obrigatórias</span>
                    <strong>{requiredTasks || workOrder.required_tasks_count}</strong>
                  </div>
                  <div>
                    <span>Obrigatórias concluídas</span>
                    <strong>{completedRequiredTasks || workOrder.completed_required_tasks_count}</strong>
                  </div>
                </div>

                {tasks.length > 0 ? (
                  <details className={styles.collapseBlock} open>
                    <summary>Ver subtarefas</summary>
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
                            {task.is_required ? "Obrigatória" : "Opcional"} · {responseTypeLabels[task.response_type]} · Foto: {formatBoolean(task.requires_photo)}
                          </span>
                          <span>
                            Respondida por: {formatValue(task.completed_by_name)} · Em: {formatDateTime(task.completed_at)}
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
                  </details>
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
