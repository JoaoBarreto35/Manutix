import type { WorkOrderListItem } from "../../../../types/workOrder";
import styles from "../../styles.module.css";
import { WorkOrderCard } from "../WorkOrderCard";

type WorkOrdersListProps = {
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

export function WorkOrdersList({
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
}: WorkOrdersListProps) {
  return (
    <section className={styles.list}>
      {loading ? (
        <div className={styles.emptyState}>Carregando ordens...</div>
      ) : workOrders.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhuma ordem encontrada para os filtros atuais.
        </div>
      ) : (
        workOrders.map((order) => (
          <WorkOrderCard
            key={order.id}
            order={order}
            onPlan={onPlan}
            onAddTask={onAddTask}
            onRelease={onRelease}
            onReopenRejected={onReopenRejected}
            onExecute={onExecute}
            onValidate={onValidate}
            onOpenReport={onOpenReport}
            onOpenDetails={onOpenDetails}
          />
        ))
      )}
    </section>
  );
}
