import type { FormEvent } from "react";
import { CheckCircle2, PlayCircle } from "lucide-react";

import type {
  FinalResult,
  WorkOrderListItem,
  WorkOrderTask,
} from "../../../../types/workOrder";
import {
  finalResultLabels,
  responseTypeLabels,
} from "../../constants/workOrderLabels";
import { Button } from "../../../../components/Button";
import styles from "../../styles.module.css";

type WorkOrderExecutionPanelProps = {
  workOrder: WorkOrderListItem | null;
  executionTasks: WorkOrderTask[];
  startReason: string;
  finishParticipationReason: string;
  executionDescription: string;
  identifiedCause: string;
  solutionApplied: string;
  finalResult: FinalResult;
  materialsUsed: string;
  internalNotes: string;
  sendToValidation: boolean;
  startingExecution: boolean;
  completingTaskId: string | null;
  finishingParticipation: boolean;
  finishingOrder: boolean;
  onStartReasonChange: (value: string) => void;
  onFinishParticipationReasonChange: (value: string) => void;
  onExecutionDescriptionChange: (value: string) => void;
  onIdentifiedCauseChange: (value: string) => void;
  onSolutionAppliedChange: (value: string) => void;
  onFinalResultChange: (value: FinalResult) => void;
  onMaterialsUsedChange: (value: string) => void;
  onInternalNotesChange: (value: string) => void;
  onSendToValidationChange: (value: boolean) => void;
  onClose: () => void;
  onStartExecution: () => void;
  onCompleteTask: (task: WorkOrderTask) => void;
  onFinishParticipation: () => void;
  onFinishWorkOrder: (event: FormEvent<HTMLFormElement>) => void;
};

export function WorkOrderExecutionPanel({
  workOrder,
  executionTasks,
  startReason,
  finishParticipationReason,
  executionDescription,
  identifiedCause,
  solutionApplied,
  finalResult,
  materialsUsed,
  internalNotes,
  sendToValidation,
  startingExecution,
  completingTaskId,
  finishingParticipation,
  finishingOrder,
  onStartReasonChange,
  onFinishParticipationReasonChange,
  onExecutionDescriptionChange,
  onIdentifiedCauseChange,
  onSolutionAppliedChange,
  onFinalResultChange,
  onMaterialsUsedChange,
  onInternalNotesChange,
  onSendToValidationChange,
  onClose,
  onStartExecution,
  onCompleteTask,
  onFinishParticipation,
  onFinishWorkOrder,
}: WorkOrderExecutionPanelProps) {
  if (!workOrder) return null;

  const isExecutionOpen =
    workOrder.status === "in_execution" || workOrder.status === "paused";

  return (
    <section className={styles.formCard}>
      <div className={styles.formHeader}>
        <div>
          <span>Execução técnica</span>
          <h2>Executar OS {workOrder.work_order_code}</h2>
          <p>
            {workOrder.asset_code} - {workOrder.asset_name}
          </p>
        </div>
      </div>

      {workOrder.status === "released" && (
        <div className={styles.executionBlock}>
          <h3>Iniciar execução</h3>

          <label>
            Observação de início
            <textarea
              value={startReason}
              onChange={(event) => onStartReasonChange(event.target.value)}
              rows={3}
              placeholder="Ex: Técnico chegou ao local e iniciou verificação."
            />
          </label>

          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={onClose}>
              Fechar
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={onStartExecution}
              loading={startingExecution}
            >
              <PlayCircle size={16} />
              {startingExecution ? "Iniciando..." : "Iniciar execução"}
            </Button>
          </div>
        </div>
      )}

      {isExecutionOpen && (
        <>
          <div className={styles.executionBlock}>
            <h3>Checklist da OS</h3>

            {executionTasks.length === 0 ? (
              <p className={styles.mutedText}>
                Nenhuma subtarefa cadastrada para esta OS.
              </p>
            ) : (
              <div className={styles.taskList}>
                {executionTasks.map((task) => (
                  <article key={task.id} className={styles.taskItem}>
                    <div>
                      <strong>{task.title}</strong>
                      <span>
                        {responseTypeLabels[task.response_type]} ·{" "}
                        {task.is_required ? "Obrigatória" : "Opcional"} ·{" "}
                        {task.status === "completed"
                          ? "Concluída"
                          : task.status === "not_applicable"
                            ? "Não aplicável"
                            : "Pendente"}
                      </span>
                      {task.description && <p>{task.description}</p>}
                    </div>

                    {task.status === "pending" && (
                      <Button
                        type="button"
                        variant="success"
                        size="sm"
                        onClick={() => onCompleteTask(task)}
                        loading={completingTaskId === task.id}
                      >
                        <CheckCircle2 size={16} />
                        {completingTaskId === task.id
                          ? "Concluindo..."
                          : "Concluir"}
                      </Button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className={styles.executionBlock}>
            <h3>Finalizar participação</h3>

            <label>
              Observação da participação
              <textarea
                value={finishParticipationReason}
                onChange={(event) =>
                  onFinishParticipationReasonChange(event.target.value)
                }
                rows={3}
                placeholder="Ex: Técnico finalizou sua atividade na OS."
              />
            </label>

            <Button
              type="button"
              variant="secondary"
              onClick={onFinishParticipation}
              loading={finishingParticipation}
            >
              {finishingParticipation
                ? "Finalizando..."
                : "Finalizar minha participação"}
            </Button>
          </div>

          <form onSubmit={onFinishWorkOrder} className={styles.form}>
            <label className={styles.fullField}>
              Descrição do serviço executado
              <textarea
                value={executionDescription}
                onChange={(event) =>
                  onExecutionDescriptionChange(event.target.value)
                }
                rows={4}
                placeholder="Descreva exatamente o que foi feito."
                required
              />
            </label>

            <label className={styles.fullField}>
              Causa identificada
              <textarea
                value={identifiedCause}
                onChange={(event) => onIdentifiedCauseChange(event.target.value)}
                rows={3}
                placeholder="Ex: Vedação danificada na conexão."
                required
              />
            </label>

            <label className={styles.fullField}>
              Solução aplicada
              <textarea
                value={solutionApplied}
                onChange={(event) => onSolutionAppliedChange(event.target.value)}
                rows={3}
                placeholder="Ex: Substituição da vedação e teste de estanqueidade."
                required
              />
            </label>

            <label>
              Resultado final
              <select
                value={finalResult}
                onChange={(event) =>
                  onFinalResultChange(event.target.value as FinalResult)
                }
              >
                {Object.entries(finalResultLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Enviar para validação?
              <select
                value={sendToValidation ? "yes" : "no"}
                onChange={(event) =>
                  onSendToValidationChange(event.target.value === "yes")
                }
              >
                <option value="yes">Sim</option>
                <option value="no">Não</option>
              </select>
            </label>

            <label className={styles.fullField}>
              Materiais utilizados
              <textarea
                value={materialsUsed}
                onChange={(event) => onMaterialsUsedChange(event.target.value)}
                rows={3}
                placeholder="Ex: Veda rosca, conexão, parafusos..."
              />
            </label>

            <label className={styles.fullField}>
              Observações internas
              <textarea
                value={internalNotes}
                onChange={(event) => onInternalNotesChange(event.target.value)}
                rows={3}
                placeholder="Observações internas para a equipe."
              />
            </label>

            <div className={styles.formActions}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>

              <Button type="submit" variant="primary" loading={finishingOrder}>
                <CheckCircle2 size={16} />
                {finishingOrder ? "Finalizando..." : "Finalizar OS"}
              </Button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
