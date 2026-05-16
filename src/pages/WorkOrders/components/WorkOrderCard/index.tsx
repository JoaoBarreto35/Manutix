import type { KeyboardEvent } from "react";

import {
  Clock3,
  MapPin,
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
import { getWorkOrderPrimaryAction, type WorkOrderQuickAction } from "../../utils/workOrderQuickActions";
import styles from "./styles.module.css";

type WorkOrderCardProps = {
  order: WorkOrderListItem;
  onOpenDetails: (workOrder: WorkOrderListItem) => void;
  onOpenAction: (workOrder: WorkOrderListItem, action: WorkOrderQuickAction) => void;
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

function getRequiredTasksProgressPercent(order: WorkOrderListItem) {
  const progressPercent = Number(order.required_tasks_progress_percent ?? 0);

  if (Number.isNaN(progressPercent)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(progressPercent)));
}

export function WorkOrderCard({
  order,
  onOpenDetails,
  onOpenAction,
}: WorkOrderCardProps) {
  const scheduleReference = getScheduleReference(order);
  const scheduleTooltip = getScheduleTooltip(order);
  const requiredTasksProgressPercent = getRequiredTasksProgressPercent(order);
  const requiredTasksProgressLabel = `${requiredTasksProgressPercent}%`;
  const primaryAction = getWorkOrderPrimaryAction(order);

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
        {primaryAction && (
          <Button
            type="button"
            variant={primaryAction.action === "details" ? "secondary" : "primary"}
            size="sm"
            title={primaryAction.title}
            onClick={(event) => {
              event.stopPropagation();
              onOpenAction(order, primaryAction.action);
            }}
          >
            {primaryAction.label}
          </Button>
        )}
      </div>
    </article>
  );
}
