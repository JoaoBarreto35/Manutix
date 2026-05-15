import {
  CalendarClock,
  CheckCircle2,
  FileText,
  ListChecks,
  PlayCircle,
  Send,
} from "lucide-react";

import { Button } from "../../../../components/Button";
import type { WorkOrderListItem } from "../../../../types/workOrder";
import {
  maintenanceTypeLabels,
  priorityLabels,
  statusLabels,
} from "../../constants/workOrderLabels";
import { formatDateTime } from "../../utils/workOrderFormatters";
import styles from "./styles.module.css";

type WorkOrdersTableProps = {
  loading: boolean;
  workOrders: WorkOrderListItem[];
  onPlan: (workOrder: WorkOrderListItem) => void;
  onAddTask: (workOrder: WorkOrderListItem) => void;
  onRelease: (workOrder: WorkOrderListItem) => void;
  onReopenRejected: (workOrder: WorkOrderListItem) => void;
  onExecute: (workOrder: WorkOrderListItem) => void;
  onValidate: (workOrder: WorkOrderListItem) => void;
  onOpenReport: (workOrder: WorkOrderListItem) => void;
  onOpenDetails: (workOrder: WorkOrderListItem) => void;
};

export function WorkOrdersTable({
  loading,
  workOrders,
  onPlan,
  onAddTask,
  onRelease,
  onReopenRejected,
  onExecute,
  onValidate,
  onOpenReport,
  onOpenDetails,
}: WorkOrdersTableProps) {
  if (loading) {
    return <div className={styles.emptyState}>Carregando ordens...</div>;
  }

  if (workOrders.length === 0) {
    return (
      <div className={styles.emptyState}>
        Nenhuma ordem encontrada para os filtros atuais.
      </div>
    );
  }

  return (
    <section className={styles.tableCard} aria-label="Lista de ordens de serviço">
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>OS</th>
              <th>Status</th>
              <th>Prioridade</th>
              <th>Tipo</th>
              <th>Ativo/local</th>
              <th>Responsável</th>
              <th>Programado</th>
              <th>Prazo</th>
              <th>Subtarefas</th>
              <th>Horas</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {workOrders.map((order) => (
              <tr key={order.id} className={styles.clickableRow} onClick={() => onOpenDetails(order)}>
                <td>
                  <div className={styles.orderCell}>
                    <strong>{order.work_order_code}</strong>
                    <span>{order.title}</span>
                  </div>
                </td>

                <td>
                  <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </td>

                <td>
                  <span className={`${styles.priorityBadge} ${styles[order.priority]}`}>
                    {priorityLabels[order.priority]}
                  </span>
                </td>

                <td>{maintenanceTypeLabels[order.maintenance_type]}</td>

                <td>
                  <div className={styles.assetCell}>
                    <strong>{order.asset_code}</strong>
                    <span>{order.asset_name}</span>
                  </div>
                </td>

                <td>{order.primary_user_name || "Não definido"}</td>
                <td>{formatDateTime(order.scheduled_start_at)}</td>
                <td>{formatDateTime(order.calculated_due_at)}</td>
                <td>{order.tasks_count}</td>
                <td>{Math.round(order.total_labor_minutes / 60)}h</td>

                <td>
                  <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
                    {order.status === "waiting_planning" && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => onPlan(order)}>
                        <CalendarClock size={16} />
                        Planejar
                      </Button>
                    )}

                    {order.status === "rejected_by_client" && (
                      <Button type="button" variant="warning" size="sm" onClick={() => onReopenRejected(order)}>
                        <CalendarClock size={16} />
                        Replanejar
                      </Button>
                    )}

                    {(order.status === "waiting_planning" || order.status === "planned") && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => onAddTask(order)}>
                        <ListChecks size={16} />
                        Subtarefa
                      </Button>
                    )}

                    {order.status === "planned" && (
                      <Button type="button" variant="primary" size="sm" onClick={() => onRelease(order)}>
                        <Send size={16} />
                        Liberar
                      </Button>
                    )}

                    {order.status === "released" && (
                      <Button type="button" variant="primary" size="sm" onClick={() => onExecute(order)}>
                        <PlayCircle size={16} />
                        Iniciar
                      </Button>
                    )}

                    {order.status === "in_execution" && (
                      <Button type="button" variant="primary" size="sm" onClick={() => onExecute(order)}>
                        <PlayCircle size={16} />
                        Continuar
                      </Button>
                    )}

                    {order.status === "paused" && (
                      <Button type="button" variant="primary" size="sm" onClick={() => onExecute(order)}>
                        <PlayCircle size={16} />
                        Retomar
                      </Button>
                    )}

                    {order.status === "waiting_validation" && (
                      <Button type="button" variant="success" size="sm" onClick={() => onValidate(order)}>
                        <CheckCircle2 size={16} />
                        Validar
                      </Button>
                    )}

                    {(order.status === "waiting_validation" ||
                      order.status === "closed" ||
                      order.status === "rejected_by_client") && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => onOpenReport(order)}>
                        <FileText size={16} />
                        Relatório
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
