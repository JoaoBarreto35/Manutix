import { AlertTriangle, CheckCircle2 } from "lucide-react";
import styles from "../../styles.module.css";

type WorkOrdersFeedbackProps = {
  errorMessage: string;
  successMessage: string;
};

export function WorkOrdersFeedback({
  errorMessage,
  successMessage,
}: WorkOrdersFeedbackProps) {
  return (
    <>
      {errorMessage && (
        <div className={styles.errorBox}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className={styles.successBox}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}
    </>
  );
}
