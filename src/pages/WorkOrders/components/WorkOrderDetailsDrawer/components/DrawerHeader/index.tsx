import { X } from "lucide-react";

import { Button } from "../../../../../../components/Button";
import type { WorkOrderListItem } from "../../../../../../types/workOrder";
import { getOriginLabel } from "../../helpers";
import styles from "../../styles.module.css";

type DrawerHeaderProps = {
  workOrder: WorkOrderListItem;
  onClose: () => void;
};

export function DrawerHeader({ workOrder, onClose }: DrawerHeaderProps) {
  return (
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
  );
}
