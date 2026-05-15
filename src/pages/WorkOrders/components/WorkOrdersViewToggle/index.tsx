import { Columns3, Rows3 } from "lucide-react";

import { Button } from "../../../../components/Button";
import styles from "./styles.module.css";

export type WorkOrdersViewMode = "kanban" | "list";

type WorkOrdersViewToggleProps = {
  viewMode: WorkOrdersViewMode;
  totalItems: number;
  onViewModeChange: (viewMode: WorkOrdersViewMode) => void;
};

export function WorkOrdersViewToggle({
  viewMode,
  totalItems,
  onViewModeChange,
}: WorkOrdersViewToggleProps) {
  return (
    <section className={styles.wrapper} aria-label="Alternar visualização de OS">
      <div>
        <strong>Visualização</strong>
        <span>
          {totalItems} {totalItems === 1 ? "ordem encontrada" : "ordens encontradas"}
        </span>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant={viewMode === "kanban" ? "primary" : "secondary"}
          size="sm"
          onClick={() => onViewModeChange("kanban")}
        >
          <Columns3 size={16} />
          Kanban
        </Button>

        <Button
          type="button"
          variant={viewMode === "list" ? "primary" : "secondary"}
          size="sm"
          onClick={() => onViewModeChange("list")}
        >
          <Rows3 size={16} />
          Lista
        </Button>
      </div>
    </section>
  );
}
