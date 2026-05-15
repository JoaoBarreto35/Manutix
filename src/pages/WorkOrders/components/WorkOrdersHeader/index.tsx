import { RefreshCw } from "lucide-react";

import { Button } from "../../../../components/Button";
import styles from "../../styles.module.css";

type WorkOrdersHeaderProps = {
  workspaceName?: string | null;
  onRefresh: () => void;
};

export function WorkOrdersHeader({
  workspaceName,
  onRefresh,
}: WorkOrdersHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <span className={styles.eyebrow}>Execução operacional</span>
        <h1>Ordens de Serviço</h1>
        <p>
          Liste, filtre, planeje, crie subtarefas, libere, execute, valide e
          consulte relatórios das ordens de serviço do workspace{" "}
          <strong>{workspaceName}</strong>.
        </p>
      </div>

      <Button type="button" variant="secondary" onClick={onRefresh}>
        <RefreshCw size={16} />
        Atualizar
      </Button>
    </header>
  );
}
