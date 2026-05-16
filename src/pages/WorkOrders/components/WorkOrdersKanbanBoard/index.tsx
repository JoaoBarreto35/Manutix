import type { WorkOrderListItem } from "../../../../types/workOrder";
import { workOrderKanbanGroups } from "../../constants/workOrderLabels";
import { WorkOrderCard } from "../WorkOrderCard";
import type { WorkOrderQuickAction } from "../../utils/workOrderQuickActions";
import styles from "./styles.module.css";

type WorkOrdersKanbanBoardProps = {
  loading: boolean;
  workOrders: WorkOrderListItem[];
  onOpenDetails: (workOrder: WorkOrderListItem) => void;
  onOpenAction: (workOrder: WorkOrderListItem, action: WorkOrderQuickAction) => void;
};

function getOrdersByGroup(
  workOrders: WorkOrderListItem[],
  groupStatuses: string[]
) {
  return workOrders.filter((workOrder) => groupStatuses.includes(workOrder.status));
}

export function WorkOrdersKanbanBoard({
  loading,
  workOrders,
  onOpenDetails,
  onOpenAction,
}: WorkOrdersKanbanBoardProps) {
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
    <section className={styles.board} aria-label="Kanban de ordens de serviço">
      {workOrderKanbanGroups.map((group) => {
        const orders = getOrdersByGroup(workOrders, group.statuses);

        return (
          <div key={group.id} className={styles.column}>
            <header className={styles.columnHeader}>
              <div>
                <strong>{group.title}</strong>
                <small>{group.description}</small>
              </div>
              <span>{orders.length}</span>
            </header>

            <div className={styles.columnContent}>
              {orders.length === 0 ? (
                <div className={styles.columnEmpty}>Nenhuma OS neste grupo.</div>
              ) : (
                orders.map((order) => (
                  <WorkOrderCard
                    key={order.id}
                    order={order}
                    onOpenDetails={onOpenDetails}
                    onOpenAction={onOpenAction}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
