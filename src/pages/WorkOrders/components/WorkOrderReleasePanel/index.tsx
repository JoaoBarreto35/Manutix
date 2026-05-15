import type { FormEvent } from "react";
import { Send } from "lucide-react";
import type { WorkOrderListItem } from "../../../../types/workOrder";
import { Button } from "../../../../components/Button";
import styles from "../../styles.module.css";

type WorkOrderReleasePanelProps = {
  workOrder: WorkOrderListItem | null;
  releaseReason: string;
  releasing: boolean;
  onReleaseReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function WorkOrderReleasePanel({
  workOrder,
  releaseReason,
  releasing,
  onReleaseReasonChange,
  onClose,
  onSubmit,
}: WorkOrderReleasePanelProps) {
  if (!workOrder) return null;

  return (
    <section className={styles.formCard}>
      <div className={styles.formHeader}>
        <div>
          <span>Liberação</span>
          <h2>Liberar OS {workOrder.work_order_code}</h2>
          <p>
            Após liberar, a ordem ficará disponível para início da execução
            técnica.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className={styles.form}>
        <label className={styles.fullField}>
          Observação da liberação
          <textarea
            value={releaseReason}
            onChange={(event) => onReleaseReasonChange(event.target.value)}
            rows={3}
            placeholder="Ex: OS liberada conforme programação aprovada."
          />
        </label>

        <div className={styles.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="submit" variant="primary" loading={releasing}>
            <Send size={16} />
            {releasing ? "Liberando..." : "Liberar para execução"}
          </Button>
        </div>
      </form>
    </section>
  );
}
