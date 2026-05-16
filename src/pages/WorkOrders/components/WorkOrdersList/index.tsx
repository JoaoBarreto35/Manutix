import type { WorkOrderListItem } from "../../../../types/workOrder";
import type { WorkOrderQuickAction } from "../../utils/workOrderQuickActions";
import styles from "../../styles.module.css";
import { WorkOrderCard } from "../WorkOrderCard";

type WorkOrdersListProps = {
  loading: boolean;
  workOrders: WorkOrderListItem[];
  onOpenDetails: (workOrder: WorkOrderListItem) => void;
  onOpenAction: (workOrder: WorkOrderListItem, action: WorkOrderQuickAction) => void;
};

export function WorkOrdersList({
  loading,
  workOrders,
  onOpenDetails,
  onOpenAction,
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
            onOpenDetails={onOpenDetails}
            onOpenAction={onOpenAction}
          />
        ))
      )}
    </section>
  );
}
