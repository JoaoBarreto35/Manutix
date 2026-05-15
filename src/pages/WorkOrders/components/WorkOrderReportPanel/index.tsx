import type { WorkOrderListItem, WorkOrderReport } from "../../../../types/workOrder";
import {
  finalResultLabels,
  maintenanceTypeLabels,
  priorityLabels,
  responseTypeLabels,
  statusLabels,
  validationResultLabels,
} from "../../constants/workOrderLabels";
import {
  formatDateTime,
  formatMinutes,
  stringifyValue,
} from "../../utils/workOrderFormatters";
import { Button } from "../../../../components/Button";
import styles from "../../styles.module.css";

type WorkOrderReportPanelProps = {
  workOrder: WorkOrderListItem | null;
  report: WorkOrderReport | null;
  loading: boolean;
  onClose: () => void;
};

export function WorkOrderReportPanel({
  workOrder,
  report,
  loading,
  onClose,
}: WorkOrderReportPanelProps) {
  if (!workOrder) {
    return null;
  }

  return (
        <section className={styles.reportCard}>
          <div className={styles.reportHeader}>
            <div>
              <span>Relatório da OS</span>
              <h2>{workOrder.work_order_code}</h2>
              <p>{workOrder.title}</p>
            </div>

            <Button type="button" variant="secondary" onClick={onClose}>
              Fechar relatório
            </Button>
          </div>

          {loading ? (
            <div className={styles.emptyState}>Carregando relatório...</div>
          ) : report ? (
            <div className={styles.reportGrid}>
              <section className={styles.reportSection}>
                <h3>Dados principais</h3>

                <div className={styles.reportInfoGrid}>
                  <span>Status</span>
                  <strong>{statusLabels[report.status]}</strong>

                  <span>Tipo</span>
                  <strong>
                    {maintenanceTypeLabels[report.maintenance_type]}
                  </strong>

                  <span>Prioridade</span>
                  <strong>{priorityLabels[report.priority]}</strong>

                  <span>Origem</span>
                  <strong>{report.origin}</strong>

                  <span>Prazo calculado</span>
                  <strong>{formatDateTime(report.calculated_due_at)}</strong>

                  <span>Início programado</span>
                  <strong>{formatDateTime(report.scheduled_start_at)}</strong>

                  <span>Fim programado</span>
                  <strong>{formatDateTime(report.scheduled_end_at)}</strong>

                  <span>Início real</span>
                  <strong>{formatDateTime(report.actual_started_at)}</strong>

                  <span>Fim real</span>
                  <strong>{formatDateTime(report.actual_finished_at)}</strong>

                  <span>HH total</span>
                  <strong>
                    {formatMinutes(report.total_labor_minutes)}
                  </strong>

                  <span>Duração calendário</span>
                  <strong>
                    {formatMinutes(report.calendar_duration_minutes)}
                  </strong>
                </div>
              </section>

              <section className={styles.reportSection}>
                <h3>Ativo/local</h3>

                <div className={styles.reportInfoGrid}>
                  <span>Código</span>
                  <strong>{report.asset.code}</strong>

                  <span>Nome</span>
                  <strong>{report.asset.name}</strong>

                  <span>Tipo</span>
                  <strong>{report.asset.type_name}</strong>

                  <span>Natureza</span>
                  <strong>{report.asset.kind}</strong>

                  <span>Criticidade</span>
                  <strong>{report.asset.criticality}</strong>
                </div>
              </section>

              {report.service_request && (
                <section className={styles.reportSection}>
                  <h3>Chamado de origem</h3>

                  <div className={styles.reportInfoGrid}>
                    <span>Código</span>
                    <strong>{report.service_request.code}</strong>

                    <span>Solicitante</span>
                    <strong>
                      {report.service_request.opened_by_name ||
                        "Usuário"}
                    </strong>

                    <span>Problema</span>
                    <strong>
                      {report.service_request.problem ||
                        report.service_request.problem_other_text ||
                        "Não informado"}
                    </strong>

                    <span>Abertura</span>
                    <strong>
                      {formatDateTime(report.service_request.created_at)}
                    </strong>
                  </div>

                  <p className={styles.reportText}>
                    {report.service_request.description}
                  </p>
                </section>
              )}

              {report.preventive && (
                <section className={styles.reportSection}>
                  <h3>Preventiva</h3>

                  <div className={styles.reportInfoGrid}>
                    <span>Plano</span>
                    <strong>{report.preventive.plan_name}</strong>

                    <span>Tarefa</span>
                    <strong>{report.preventive.task_name}</strong>

                    <span>Vencimento</span>
                    <strong>{report.preventive.due_date}</strong>
                  </div>
                </section>
              )}

              <section className={styles.reportSection}>
                <h3>Execução</h3>

                <div className={styles.reportTextGroup}>
                  <div>
                    <span>Descrição do serviço</span>
                    <p>
                      {report.execution_description ||
                        "Não informado."}
                    </p>
                  </div>

                  <div>
                    <span>Causa identificada</span>
                    <p>{report.identified_cause || "Não informado."}</p>
                  </div>

                  <div>
                    <span>Solução aplicada</span>
                    <p>{report.solution_applied || "Não informado."}</p>
                  </div>

                  <div>
                    <span>Resultado</span>
                    <p>
                      {report.result
                        ? finalResultLabels[report.result]
                        : "Não informado."}
                    </p>
                  </div>

                  <div>
                    <span>Materiais utilizados</span>
                    <p>{report.materials_used || "Não informado."}</p>
                  </div>

                  <div>
                    <span>Observações internas</span>
                    <p>{report.internal_notes || "Não informado."}</p>
                  </div>
                </div>
              </section>

              <section className={styles.reportSection}>
                <h3>Equipe</h3>

                {report.assignments &&
                  report.assignments.length > 0 ? (
                  <div className={styles.reportList}>
                    {report.assignments.map((assignment) => (
                      <article key={assignment.assignment_id}>
                        <strong>{assignment.user_name || "Usuário"}</strong>
                        <span>
                          {assignment.is_primary
                            ? "Responsável principal"
                            : "Apoio"}{" "}
                          · {assignment.status} ·{" "}
                          {formatMinutes(assignment.total_minutes)}
                        </span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.mutedText}>Nenhuma equipe vinculada.</p>
                )}
              </section>

              <section className={styles.reportSection}>
                <h3>Checklist/Subtarefas</h3>

                {report.tasks && report.tasks.length > 0 ? (
                  <div className={styles.reportList}>
                    {report.tasks.map((task) => (
                      <article key={task.id}>
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
                        {task.completed_at && (
                          <small>
                            Concluída por{" "}
                            {task.completed_by_name || "Usuário"} em{" "}
                            {formatDateTime(task.completed_at)}
                          </small>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.mutedText}>Nenhuma subtarefa cadastrada.</p>
                )}
              </section>

              <section className={styles.reportSection}>
                <h3>Anexos/Evidências</h3>

                {report.attachments &&
                  report.attachments.length > 0 ? (
                  <div className={styles.reportList}>
                    {report.attachments.map((attachment) => (
                      <article key={attachment.id}>
                        <strong>{attachment.file_name}</strong>
                        <span>
                          {attachment.attachment_type} ·{" "}
                          {formatDateTime(attachment.created_at)}
                        </span>
                        {attachment.description && (
                          <p>{attachment.description}</p>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.mutedText}>Nenhum anexo cadastrado.</p>
                )}
              </section>

              <section className={styles.reportSection}>
                <h3>Validações</h3>

                {report.validations &&
                  report.validations.length > 0 ? (
                  <div className={styles.reportList}>
                    {report.validations.map((validation) => (
                      <article key={validation.id}>
                        <strong>
                          {validationResultLabels[validation.validation_result]}
                        </strong>
                        <span>
                          {validation.validation_type} ·{" "}
                          {validation.validated_by_name || "Usuário"} ·{" "}
                          {formatDateTime(validation.created_at)}
                        </span>
                        {validation.rejection_reason && (
                          <p>Motivo: {validation.rejection_reason}</p>
                        )}
                        {validation.comment && <p>{validation.comment}</p>}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.mutedText}>Nenhuma validação registrada.</p>
                )}
              </section>

              <section className={styles.reportSectionFull}>
                <h3>Histórico</h3>

                {report.history && report.history.length > 0 ? (
                  <div className={styles.reportList}>
                    {report.history.map((history) => (
                      <article key={history.id}>
                        <strong>{history.action}</strong>
                        <span>
                          {history.performed_by_name || "Sistema"} ·{" "}
                          {formatDateTime(history.created_at)}
                        </span>
                        {history.reason && <p>{history.reason}</p>}
                        {(history.old_value || history.new_value) && (
                          <small>
                            De: {stringifyValue(history.old_value)} | Para:{" "}
                            {stringifyValue(history.new_value)}
                          </small>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className={styles.mutedText}>Nenhum histórico registrado.</p>
                )}
              </section>
            </div>
          ) : (
            <div className={styles.emptyState}>Relatório não encontrado.</div>
          )}
        </section>

  );
}
