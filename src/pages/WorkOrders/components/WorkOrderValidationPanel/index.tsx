import type { FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import type {
  WorkOrderListItem,
  WorkOrderValidationResult,
} from "../../../../types/workOrder";
import { Button } from "../../../../components/Button";
import styles from "../../styles.module.css";

type WorkOrderValidationPanelProps = {
  workOrder: WorkOrderListItem | null;
  validationResult: WorkOrderValidationResult;
  validationComment: string;
  rejectionReason: string;
  validating: boolean;
  onValidationResultChange: (value: WorkOrderValidationResult) => void;
  onValidationCommentChange: (value: string) => void;
  onRejectionReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function WorkOrderValidationPanel({
  workOrder,
  validationResult,
  validationComment,
  rejectionReason,
  validating,
  onValidationResultChange,
  onValidationCommentChange,
  onRejectionReasonChange,
  onClose,
  onSubmit,
}: WorkOrderValidationPanelProps) {
  if (!workOrder) return null;

  return (
    <section className={styles.formCard}>
      <div className={styles.formHeader}>
        <div>
          <span>Validação</span>
          <h2>Validar OS {workOrder.work_order_code}</h2>
          <p>
            {workOrder.asset_code} - {workOrder.asset_name}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className={styles.form}>
        <label>
          Resultado da validação
          <select
            value={validationResult}
            onChange={(event) =>
              onValidationResultChange(
                event.target.value as WorkOrderValidationResult
              )
            }
          >
            <option value="approved">Aprovar</option>
            <option value="rejected">Reprovar</option>
          </select>
        </label>

        {validationResult === "rejected" && (
          <label className={styles.fullField}>
            Motivo da reprovação
            <textarea
              value={rejectionReason}
              onChange={(event) => onRejectionReasonChange(event.target.value)}
              rows={3}
              placeholder="Explique o motivo da reprovação."
              required
            />
          </label>
        )}

        <label className={styles.fullField}>
          Comentário
          <textarea
            value={validationComment}
            onChange={(event) => onValidationCommentChange(event.target.value)}
            rows={3}
            placeholder="Comentário opcional sobre a validação."
          />
        </label>

        <div className={styles.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="submit" variant="primary" loading={validating}>
            <CheckCircle2 size={16} />
            {validating
              ? "Validando..."
              : validationResult === "approved"
                ? "Aprovar OS"
                : "Reprovar OS"}
          </Button>
        </div>
      </form>
    </section>
  );
}
