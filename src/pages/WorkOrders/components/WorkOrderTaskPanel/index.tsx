import type { FormEvent } from "react";
import { ListChecks } from "lucide-react";
import type {
  TaskResponseType,
  WorkOrderListItem,
} from "../../../../types/workOrder";
import { Button } from "../../../../components/Button";
import styles from "../../styles.module.css";

type WorkOrderTaskPanelProps = {
  workOrder: WorkOrderListItem | null;
  taskTitle: string;
  taskDescription: string;
  taskResponseType: TaskResponseType;
  taskIsRequired: boolean;
  taskRequiresPhoto: boolean;
  addingTask: boolean;
  applyingStandardTasks: boolean;
  onTaskTitleChange: (value: string) => void;
  onTaskDescriptionChange: (value: string) => void;
  onTaskResponseTypeChange: (value: TaskResponseType) => void;
  onTaskIsRequiredChange: (value: boolean) => void;
  onTaskRequiresPhotoChange: (value: boolean) => void;
  onClose: () => void;
  onApplyStandardTasks: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function WorkOrderTaskPanel({
  workOrder,
  taskTitle,
  taskDescription,
  taskResponseType,
  taskIsRequired,
  taskRequiresPhoto,
  addingTask,
  applyingStandardTasks,
  onTaskTitleChange,
  onTaskDescriptionChange,
  onTaskResponseTypeChange,
  onTaskIsRequiredChange,
  onTaskRequiresPhotoChange,
  onClose,
  onApplyStandardTasks,
  onSubmit,
}: WorkOrderTaskPanelProps) {
  if (!workOrder) return null;

  return (
    <section className={styles.formCard}>
      <div className={styles.formHeader}>
        <div>
          <span>Checklist</span>
          <h2>Adicionar subtarefa</h2>
          <p>
            OS {workOrder.work_order_code} · {workOrder.asset_code} -{" "}
            {workOrder.asset_name}
          </p>
        </div>
      </div>

      <div className={styles.formHeader}>
        <div>
          <strong>Checklist padrão</strong>
          <p>
            Aplique as subtarefas configuradas no banco para este workspace,
            tipo de OS e tipo de ativo. Se não houver template específico,
            o sistema usa o template genérico ativo.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          loading={applyingStandardTasks}
          onClick={onApplyStandardTasks}
        >
          <ListChecks size={16} />
          {applyingStandardTasks ? "Aplicando..." : "Aplicar checklist padrão"}
        </Button>
      </div>

      <form onSubmit={onSubmit} className={styles.form}>
        <label className={styles.fullField}>
          Título da subtarefa
          <input
            value={taskTitle}
            onChange={(event) => onTaskTitleChange(event.target.value)}
            placeholder="Ex: Testar funcionamento após reparo"
            required
          />
        </label>

        <label>
          Tipo de resposta
          <select
            value={taskResponseType}
            onChange={(event) =>
              onTaskResponseTypeChange(event.target.value as TaskResponseType)
            }
          >
            <option value="checkbox">Checkbox</option>
            <option value="text">Texto</option>
            <option value="number">Número</option>
            <option value="boolean">Sim/Não</option>
            <option value="compliance">Conformidade</option>
            <option value="photo">Foto</option>
          </select>
        </label>

        <label>
          Obrigatória?
          <select
            value={taskIsRequired ? "yes" : "no"}
            onChange={(event) => onTaskIsRequiredChange(event.target.value === "yes")}
          >
            <option value="yes">Sim</option>
            <option value="no">Não</option>
          </select>
        </label>

        <label>
          Exige foto?
          <select
            value={taskRequiresPhoto ? "yes" : "no"}
            onChange={(event) =>
              onTaskRequiresPhotoChange(event.target.value === "yes")
            }
          >
            <option value="no">Não</option>
            <option value="yes">Sim</option>
          </select>
        </label>

        <label className={styles.fullField}>
          Descrição
          <textarea
            value={taskDescription}
            onChange={(event) => onTaskDescriptionChange(event.target.value)}
            rows={3}
            placeholder="Detalhe como a subtarefa deve ser verificada."
          />
        </label>

        <div className={styles.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="submit" variant="primary" loading={addingTask}>
            <ListChecks size={16} />
            {addingTask ? "Adicionando..." : "Adicionar subtarefa"}
          </Button>
        </div>
      </form>
    </section>
  );
}
