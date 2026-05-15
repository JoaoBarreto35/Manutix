import type { KeyboardEvent } from "react";

import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  ListChecks,
  MapPin,
  PlayCircle,
  Send,
  Timer,
  UserRound,
} from "lucide-react";

import { Button } from "../../../../components/Button";
import type { WorkOrderListItem } from "../../../../types/workOrder";
import {
  maintenanceTypeLabels,
  priorityLabels,
  scheduleHealthLabels,
  statusLabels,
} from "../../constants/workOrderLabels";
import { formatDateTime, formatMinutes } from "../../utils/workOrderFormatters";
import styles from "./styles.module.css";

type WorkOrderCardProps = {
  order: WorkOrderListItem;
  onPlan: (workOrder: WorkOrderListItem) => void;
  onAddTask: (workOrder: WorkOrderListItem) => void;
  onRelease: (workOrder: WorkOrderListItem) => void;
  onReopenRejected: (workOrder: WorkOrderListItem) => void;
  onExecute: (workOrder: WorkOrderListItem) => void;
  onValidate: (workOrder: WorkOrderListItem) => void;
  onOpenReport: (workOrder: WorkOrderListItem) => void;
  onOpenDetails: (workOrder: WorkOrderListItem) => void;
};

const priorityClassMap: Record<WorkOrderListItem["priority"], string> = {
  low: styles.priorityLow,
  medium: styles.priorityMedium,
  high: styles.priorityHigh,
  critical: styles.priorityCritical,
};

const scheduleHealthClassMap: Record<WorkOrderListItem["schedule_health"], string> = {
  completed_on_time: styles.scheduleOk,
  completed_late: styles.scheduleDanger,
  overdue: styles.scheduleDanger,
  unscheduled: styles.scheduleMuted,
  scheduled_late: styles.scheduleWarning,
  due_today: styles.scheduleWarning,
  scheduled_on_time: styles.scheduleOk,
};

function getScheduleReference(order: WorkOrderListItem) {
  if (order.scheduled_start_at) {
    return formatDateTime(order.scheduled_start_at);
  }

  if (order.calculated_due_at) {
    return `Prazo: ${formatDateTime(order.calculated_due_at)}`;
  }

  return "Sem programação";
}

function getScheduleTooltip(order: WorkOrderListItem) {
  const status = scheduleHealthLabels[order.schedule_health];
  const scheduled = order.scheduled_start_at
    ? `Programado: ${formatDateTime(order.scheduled_start_at)}`
    : "Sem data programada";
  const due = order.calculated_due_at
    ? `Prazo: ${formatDateTime(order.calculated_due_at)}`
    : "Sem prazo calculado";

  return `${status} · ${scheduled} · ${due}`;
}

function getPrimaryActionLabel(order: WorkOrderListItem) {
  switch (order.status) {
    case "waiting_planning":
      return "Planejar";
    case "planned":
      return "Liberar";
    case "released":
      return "Iniciar";
    case "in_execution":
      return "Continuar";
    case "paused":
      return "Retomar";
    case "waiting_validation":
      return "Validar";
    case "rejected_by_client":
      return "Replanejar";
    default:
      return "Relatório";
  }
}

function getRequiredTasksProgressPercent(order: WorkOrderListItem) {
  const progressPercent = Number(order.required_tasks_progress_percent ?? 0);

  if (Number.isNaN(progressPercent)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(progressPercent)));
}

export function WorkOrderCard({
  order,
  onPlan,
  onAddTask,
  onRelease,
  onReopenRejected,
  onExecute,
  onValidate,
  onOpenReport,
  onOpenDetails,
}: WorkOrderCardProps) {
  const scheduleReference = getScheduleReference(order);
  const scheduleTooltip = getScheduleTooltip(order);
  const primaryActionLabel = getPrimaryActionLabel(order);
  const requiredTasksProgressPercent = getRequiredTasksProgressPercent(order);
  const requiredTasksProgressLabel = `${requiredTasksProgressPercent}%`;
  const hasReportAction =
    order.status === "waiting_validation" ||
    order.status === "closed" ||
    order.status === "rejected_by_client";

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenDetails(order);
    }
  }

  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      aria-label={`Abrir detalhes da ordem de serviço ${order.work_order_code}`}
      onClick={() => onOpenDetails(order)}
      onKeyDown={handleKeyDown}
    >
      <header className={styles.header}>
        <div className={styles.identity}>
          <span className={styles.code}>{order.work_order_code}</span>
          <strong className={styles.title}>{order.title}</strong>
        </div>

        <span
          className={`${styles.priorityDot} ${priorityClassMap[order.priority]}`}
          title={`Prioridade: ${priorityLabels[order.priority]}`}
          aria-label={`Prioridade: ${priorityLabels[order.priority]}`}
        />
      </header>

      <div className={styles.context}>
        <span title={`${order.asset_code} - ${order.asset_name}`}>
          <MapPin size={14} />
          {order.asset_code} · {order.asset_name}
        </span>

        <span title={order.primary_user_name || "Responsável não definido"}>
          <UserRound size={14} />
          {order.primary_user_name || "Sem responsável"}
        </span>
      </div>

      <div
        className={`${styles.schedule} ${scheduleHealthClassMap[order.schedule_health]}`}
        title={scheduleTooltip}
      >
        <span className={styles.scheduleDate}>
          <Clock3 size={15} />
          {scheduleReference}
        </span>

        <span
          className={styles.estimatedTime}
          title={
            order.estimated_duration_minutes
              ? `Tempo estimado: ${formatMinutes(order.estimated_duration_minutes)}`
              : "Sem tempo estimado"
          }
        >
          <Timer size={14} />
          {order.estimated_duration_minutes
            ? formatMinutes(order.estimated_duration_minutes)
            : "Sem estimativa"}
        </span>
      </div>

      <div className={styles.progressBlock} title={`Progresso das subtarefas obrigatórias: ${requiredTasksProgressLabel}`}>
        <div className={styles.progressTrack} aria-label={`Progresso ${requiredTasksProgressLabel}`}>
          <span
            className={styles.progressBar}
            style={{ width: `${requiredTasksProgressPercent}%` }}
          />
        </div>
        <strong className={styles.progressValue}>{requiredTasksProgressLabel}</strong>
      </div>

      <div className={styles.metaLine}>
        <span title="Tipo de manutenção">{maintenanceTypeLabels[order.maintenance_type]}</span>
        <span title="Tempo apontado">
          <Timer size={14} />
          {formatMinutes(order.total_labor_minutes)} apontado
        </span>
      </div>

      <div className={styles.statusLine}>
        <span>{statusLabels[order.status]}</span>
      </div>

      <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
        {order.status === "waiting_planning" && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onPlan(order)}>
            <CalendarClock size={16} />
            {primaryActionLabel}
          </Button>
        )}

        {order.status === "rejected_by_client" && (
          <Button type="button" variant="warning" size="sm" onClick={() => onReopenRejected(order)}>
            <CalendarClock size={16} />
            {primaryActionLabel}
          </Button>
        )}

        {(order.status === "waiting_planning" || order.status === "planned") && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onAddTask(order)}>
            <ListChecks size={16} />
            Subtarefa
          </Button>
        )}

        {order.status === "planned" && (
          <Button type="button" variant="primary" size="sm" onClick={() => onRelease(order)}>
            <Send size={16} />
            {primaryActionLabel}
          </Button>
        )}

        {order.status === "released" && (
          <Button type="button" variant="primary" size="sm" onClick={() => onExecute(order)}>
            <PlayCircle size={16} />
            {primaryActionLabel}
          </Button>
        )}

        {order.status === "in_execution" && (
          <Button type="button" variant="primary" size="sm" onClick={() => onExecute(order)}>
            <PlayCircle size={16} />
            {primaryActionLabel}
          </Button>
        )}

        {order.status === "paused" && (
          <Button type="button" variant="primary" size="sm" onClick={() => onExecute(order)}>
            <PlayCircle size={16} />
            {primaryActionLabel}
          </Button>
        )}

        {order.status === "waiting_validation" && (
          <Button type="button" variant="success" size="sm" onClick={() => onValidate(order)}>
            <CheckCircle2 size={16} />
            {primaryActionLabel}
          </Button>
        )}

        {hasReportAction && (
          <Button type="button" variant="secondary" size="sm" onClick={() => onOpenReport(order)}>
            <FileText size={16} />
            Relatório
          </Button>
        )}
      </div>
    </article>
  );
}
