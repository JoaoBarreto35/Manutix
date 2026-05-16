import type { Dispatch, FormEvent, ReactNode, SetStateAction } from "react";
import { ListChecks, Pencil, Trash2 } from "lucide-react";

import { Button } from "../../../../../../components/Button";
import type {
  TaskResponseType,
  WorkOrderListItem,
  WorkOrderReportTask,
} from "../../../../../../types/workOrder";
import { responseTypeLabels } from "../../../../constants/workOrderLabels";
import { taskResponseTypeOptions } from "../../constants";
import { formatBoolean, formatValue, getTaskStatusLabel, isBlank } from "../../helpers";
import type { TaskCompletionDraft } from "../../types";
import { formatDateTime } from "../../../../utils/workOrderFormatters";
import styles from "../../styles.module.css";

type TasksTabProps = {
  workOrder: WorkOrderListItem;
  tasks: WorkOrderReportTask[];
  completedRequiredTasks: number;
  requiredTasks: number;
  requiredProgressPercent: number;
  taskStructureEditable: boolean;
  taskResponseFillable: boolean;
  applyingStandardTasks: boolean;
  savingTaskStructure: boolean;
  completingTaskId: string | null;
  markingTaskNotApplicableId: string | null;
  updatingTaskId: string | null;
  deletingTaskId: string | null;
  taskTitle: string;
  setTaskTitle: Dispatch<SetStateAction<string>>;
  taskDescription: string;
  setTaskDescription: Dispatch<SetStateAction<string>>;
  taskResponseType: TaskResponseType;
  setTaskResponseType: Dispatch<SetStateAction<TaskResponseType>>;
  taskIsRequired: boolean;
  setTaskIsRequired: Dispatch<SetStateAction<boolean>>;
  taskRequiresPhoto: boolean;
  setTaskRequiresPhoto: Dispatch<SetStateAction<boolean>>;
  editingTaskId: string | null;
  editingTaskTitle: string;
  setEditingTaskTitle: Dispatch<SetStateAction<string>>;
  editingTaskDescription: string;
  setEditingTaskDescription: Dispatch<SetStateAction<string>>;
  editingTaskResponseType: TaskResponseType;
  setEditingTaskResponseType: Dispatch<SetStateAction<TaskResponseType>>;
  editingTaskIsRequired: boolean;
  setEditingTaskIsRequired: Dispatch<SetStateAction<boolean>>;
  editingTaskRequiresPhoto: boolean;
  setEditingTaskRequiresPhoto: Dispatch<SetStateAction<boolean>>;
  editingTaskSortOrder: number;
  setEditingTaskSortOrder: Dispatch<SetStateAction<number>>;
  editingTaskReason: string;
  setEditingTaskReason: Dispatch<SetStateAction<string>>;
  requiredFieldClassName: (missingRequiredValue: boolean) => string | undefined;
  getTaskDraft: (taskId: string) => TaskCompletionDraft;
  updateTaskDraft: (taskId: string, field: keyof TaskCompletionDraft, value: string) => void;
  renderTaskResponseField: (task: WorkOrderReportTask) => ReactNode;
  onApplyStandardTasks: (workOrderId: string) => Promise<void>;
  handleAddTaskFromDrawer: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleUpdateTaskFromDrawer: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  startEditingTask: (task: WorkOrderReportTask) => void;
  cancelEditingTask: () => void;
  handleDeleteTaskFromDrawer: (task: WorkOrderReportTask) => Promise<void>;
  handleCompleteTaskFromDrawer: (task: WorkOrderReportTask) => Promise<void>;
  handleMarkTaskNotApplicableFromDrawer: (task: WorkOrderReportTask) => Promise<void>;
};

export function TasksTab({
  workOrder,
  tasks,
  completedRequiredTasks,
  requiredTasks,
  requiredProgressPercent,
  taskStructureEditable,
  taskResponseFillable,
  applyingStandardTasks,
  savingTaskStructure,
  completingTaskId,
  markingTaskNotApplicableId,
  updatingTaskId,
  deletingTaskId,
  taskTitle,
  setTaskTitle,
  taskDescription,
  setTaskDescription,
  taskResponseType,
  setTaskResponseType,
  taskIsRequired,
  setTaskIsRequired,
  taskRequiresPhoto,
  setTaskRequiresPhoto,
  editingTaskId,
  editingTaskTitle,
  setEditingTaskTitle,
  editingTaskDescription,
  setEditingTaskDescription,
  editingTaskResponseType,
  setEditingTaskResponseType,
  editingTaskIsRequired,
  setEditingTaskIsRequired,
  editingTaskRequiresPhoto,
  setEditingTaskRequiresPhoto,
  editingTaskSortOrder,
  setEditingTaskSortOrder,
  editingTaskReason,
  setEditingTaskReason,
  requiredFieldClassName,
  getTaskDraft,
  updateTaskDraft,
  renderTaskResponseField,
  onApplyStandardTasks,
  handleAddTaskFromDrawer,
  handleUpdateTaskFromDrawer,
  startEditingTask,
  cancelEditingTask,
  handleDeleteTaskFromDrawer,
  handleCompleteTaskFromDrawer,
  handleMarkTaskNotApplicableFromDrawer,
}: TasksTabProps) {
  function isRequiredTaskMissing(task: WorkOrderReportTask) {
    return taskResponseFillable && task.is_required && task.status === "pending";
  }

  return (
    <div className={styles.tabPanel}>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>
            <ListChecks size={17} />
            Subtarefas / checklist
          </h3>

          {taskStructureEditable && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={applyingStandardTasks}
              disabled={savingTaskStructure}
              onClick={() => onApplyStandardTasks(workOrder.id)}
            >
              Aplicar checklist padrão
            </Button>
          )}
        </div>

        <div className={styles.progressCard}>
          <div>
            <span>Obrigatórias concluídas</span>
            <strong>
              {completedRequiredTasks}/{requiredTasks} · {requiredProgressPercent}%
            </strong>
          </div>
          <div className={styles.progressSummary}>
            <div className={styles.progressTrack}>
              <span style={{ width: `${requiredProgressPercent}%` }} />
            </div>
          </div>
        </div>

        {taskStructureEditable && (
          <form className={styles.taskForm} onSubmit={handleAddTaskFromDrawer}>
            <h4>Adicionar subtarefa</h4>

            <label className={styles.fullField}>
              Título
              <input
                className={requiredFieldClassName(isBlank(taskTitle))}
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                required
              />
            </label>

            <label className={styles.fullField}>
              Descrição
              <textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                rows={2}
              />
            </label>

            <label>
              Tipo de resposta
              <select
                value={taskResponseType}
                onChange={(event) =>
                  setTaskResponseType(event.target.value as TaskResponseType)
                }
              >
                {taskResponseTypeOptions.map((responseType) => (
                  <option key={responseType} value={responseType}>
                    {responseTypeLabels[responseType]}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.inlineCheck}>
              <input
                type="checkbox"
                checked={taskIsRequired}
                onChange={(event) => setTaskIsRequired(event.target.checked)}
              />
              Obrigatória
            </label>

            <label className={styles.inlineCheck}>
              <input
                type="checkbox"
                checked={taskRequiresPhoto}
                onChange={(event) => setTaskRequiresPhoto(event.target.checked)}
              />
              Exige foto
            </label>

            <div className={styles.formActions}>
              <Button type="submit" variant="primary" loading={savingTaskStructure}>
                Adicionar subtarefa
              </Button>
            </div>
          </form>
        )}

        {!taskStructureEditable && taskResponseFillable && (
          <p className={styles.readOnlyNotice}>
            A estrutura do checklist está bloqueada após liberação. Nesta etapa, preencha e conclua as subtarefas.
          </p>
        )}

        {!taskStructureEditable && !taskResponseFillable && (
          <p className={styles.readOnlyNotice}>
            Checklist disponível somente para consulta neste status da OS.
          </p>
        )}

        {tasks.length > 0 ? (
          <div className={styles.compactList}>
            {tasks.map((task) => {
              const taskDraft = getTaskDraft(task.id);
              const canFillThisTask = taskResponseFillable && task.status === "pending";
              const canEditThisTask = taskStructureEditable && task.status === "pending";
              const isEditingThisTask = editingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`${styles.compactItem} ${
                    isRequiredTaskMissing(task) ? styles.requiredTaskMissing : ""
                  }`}
                  title={
                    isRequiredTaskMissing(task)
                      ? "Subtarefa obrigatória pendente de preenchimento."
                      : undefined
                  }
                >
                  <div className={styles.itemHeader}>
                    <strong>{task.title}</strong>
                    <span className={`${styles.smallBadge} ${styles[task.status]}`}>
                      {getTaskStatusLabel(task.status)}
                    </span>
                  </div>
                  {task.description && <p>{task.description}</p>}
                  <span>
                    {responseTypeLabels[task.response_type]} · {task.is_required ? "Obrigatória" : "Opcional"} · {task.requires_photo ? "Exige foto" : "Sem foto obrigatória"}
                  </span>
                  <span>
                    Concluída por: {formatValue(task.completed_by_name)} · {formatDateTime(task.completed_at)}
                  </span>

                  {canEditThisTask && !isEditingThisTask && (
                    <div className={styles.inlineActions}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={Boolean(editingTaskId) || deletingTaskId === task.id}
                        onClick={() => startEditingTask(task)}
                      >
                        <Pencil size={14} />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        loading={deletingTaskId === task.id}
                        disabled={Boolean(editingTaskId) || updatingTaskId === task.id}
                        onClick={() => handleDeleteTaskFromDrawer(task)}
                      >
                        <Trash2 size={14} />
                        Excluir
                      </Button>
                    </div>
                  )}

                  {isEditingThisTask && (
                    <form className={styles.taskForm} onSubmit={handleUpdateTaskFromDrawer}>
                      <h4>Editar subtarefa</h4>

                      <label className={styles.fullField}>
                        Título
                        <input
                          className={requiredFieldClassName(isBlank(editingTaskTitle))}
                          value={editingTaskTitle}
                          onChange={(event) => setEditingTaskTitle(event.target.value)}
                          required
                        />
                      </label>

                      <label className={styles.fullField}>
                        Descrição
                        <textarea
                          value={editingTaskDescription}
                          onChange={(event) => setEditingTaskDescription(event.target.value)}
                          rows={2}
                        />
                      </label>

                      <label>
                        Tipo de resposta
                        <select
                          value={editingTaskResponseType}
                          onChange={(event) =>
                            setEditingTaskResponseType(event.target.value as TaskResponseType)
                          }
                        >
                          {taskResponseTypeOptions.map((responseType) => (
                            <option key={responseType} value={responseType}>
                              {responseTypeLabels[responseType]}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Ordem
                        <input
                          type="number"
                          min={0}
                          value={editingTaskSortOrder}
                          onChange={(event) =>
                            setEditingTaskSortOrder(Number(event.target.value))
                          }
                        />
                      </label>

                      <label className={styles.inlineCheck}>
                        <input
                          type="checkbox"
                          checked={editingTaskIsRequired}
                          onChange={(event) => setEditingTaskIsRequired(event.target.checked)}
                        />
                        Obrigatória
                      </label>

                      <label className={styles.inlineCheck}>
                        <input
                          type="checkbox"
                          checked={editingTaskRequiresPhoto}
                          onChange={(event) => setEditingTaskRequiresPhoto(event.target.checked)}
                        />
                        Exige foto
                      </label>

                      <label className={styles.fullField}>
                        Motivo da alteração
                        <input
                          value={editingTaskReason}
                          onChange={(event) => setEditingTaskReason(event.target.value)}
                          placeholder="Opcional, mas recomendado para histórico."
                        />
                      </label>

                      <div className={styles.formActions}>
                        <Button type="button" variant="secondary" onClick={cancelEditingTask}>
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          loading={updatingTaskId === task.id}
                          disabled={deletingTaskId === task.id}
                        >
                          Salvar subtarefa
                        </Button>
                      </div>
                    </form>
                  )}

                  {(task.answer_text || task.answer_number !== null || task.answer_boolean !== null || task.compliance_result !== null || task.not_applicable_reason) && (
                    <div className={styles.answerBox}>
                      {task.answer_text && <span>Texto: {task.answer_text}</span>}
                      {task.answer_number !== null && <span>Número: {task.answer_number}</span>}
                      {task.answer_boolean !== null && <span>Sim/Não: {formatBoolean(task.answer_boolean)}</span>}
                      {task.compliance_result !== null && <span>Conformidade: {formatBoolean(task.compliance_result)}</span>}
                      {task.not_applicable_reason && <span>Não aplicável: {task.not_applicable_reason}</span>}
                    </div>
                  )}

                  {canFillThisTask && (
                    <div className={styles.taskExecutionBox}>
                      {renderTaskResponseField(task)}

                      <label className={styles.fullField}>
                        Motivo para não aplicável
                        <input
                          className={requiredFieldClassName(
                            taskDraft.complianceStatus === "not_applicable" &&
                              isBlank(taskDraft.notApplicableReason)
                          )}
                          value={taskDraft.notApplicableReason}
                          onChange={(event) =>
                            updateTaskDraft(
                              task.id,
                              "notApplicableReason",
                              event.target.value
                            )
                          }
                          placeholder="Preencha apenas se for marcar como não aplicável."
                          required={taskDraft.complianceStatus === "not_applicable"}
                        />
                      </label>

                      <div className={styles.formActions}>
                        <Button
                          type="button"
                          variant="secondary"
                          loading={markingTaskNotApplicableId === task.id}
                          disabled={
                            completingTaskId === task.id ||
                            isBlank(taskDraft.notApplicableReason)
                          }
                          onClick={() => handleMarkTaskNotApplicableFromDrawer(task)}
                        >
                          Não aplicável
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          loading={completingTaskId === task.id}
                          disabled={markingTaskNotApplicableId === task.id}
                          onClick={() => handleCompleteTaskFromDrawer(task)}
                        >
                          Concluir
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.muted}>Nenhuma subtarefa detalhada carregada.</p>
        )}
      </section>
    </div>
  );
}
