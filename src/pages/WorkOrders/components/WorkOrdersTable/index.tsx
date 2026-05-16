import { Button } from "../../../../components/Button";
import type { WorkOrderListItem } from "../../../../types/workOrder";
import {
  maintenanceTypeLabels,
  priorityLabels,
  statusLabels,
} from "../../constants/workOrderLabels";
import { formatDateTime } from "../../utils/workOrderFormatters";
import { getWorkOrderPrimaryAction, type WorkOrderQuickAction } from "../../utils/workOrderQuickActions";
import styles from "./styles.module.css";

type WorkOrdersTableProps = {
  loading: boolean;
  workOrders: WorkOrderListItem[];
  onOpenDetails: (workOrder: WorkOrderListItem) => void;
  onOpenAction: (workOrder: WorkOrderListItem, action: WorkOrderQuickAction) => void;
};

export function WorkOrdersTable({
  loading,
  workOrders,
  onOpenDetails,
  onOpenAction,
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
              <th>Checklist</th>
              <th>Horas</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {workOrders.map((order) => (
              <tr
                key={order.id}
                className={styles.clickableRow}
                onClick={() => onOpenDetails(order)}
              >
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
                <td>{Math.round(Number(order.required_tasks_progress_percent ?? 0))}%</td>
                <td>{Math.round(order.total_labor_minutes / 60)}h</td>

                <td>
                  <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
                    {(() => {
                      const primaryAction = getWorkOrderPrimaryAction(order);

                      if (!primaryAction) {
                        return <span className={styles.emptyAction}>-</span>;
                      }

                      return (
                        <Button
                          type="button"
                          variant={primaryAction.action === "details" ? "secondary" : "primary"}
                          size="sm"
                          title={primaryAction.title}
                          onClick={() => onOpenAction(order, primaryAction.action)}
                        >
                          {primaryAction.label}
                        </Button>
                      );
                    })()}
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
