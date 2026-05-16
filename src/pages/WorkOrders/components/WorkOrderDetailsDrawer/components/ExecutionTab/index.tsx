import type { ReactNode } from "react";
import { BadgeCheck, Clock3, Paperclip } from "lucide-react";

import type { WorkOrderListItem, WorkOrderReport, WorkOrderReportAttachment, WorkOrderReportValidation } from "../../../../../../types/workOrder";
import { formatValue, getFinalResultLabel, getValidationResultLabel } from "../../helpers";
import { formatDateTime, formatMinutes } from "../../../../utils/workOrderFormatters";
import styles from "../../styles.module.css";

type ExecutionTabProps = {
  workOrder: WorkOrderListItem;
  report: WorkOrderReport | null;
  attachments: WorkOrderReportAttachment[];
  validations: WorkOrderReportValidation[];
  actionsContent: ReactNode;
  finishOrderForm: ReactNode;
};

export function ExecutionTab({
  workOrder,
  report,
  attachments,
  validations,
  actionsContent,
  finishOrderForm,
}: ExecutionTabProps) {
  return (
            <div className={styles.tabPanel}>
              <section className={styles.section}>
                <h3>
                  <Clock3 size={17} />
                  Execução e fechamento
                </h3>

                {actionsContent}
                {finishOrderForm}

                <div className={styles.infoGrid}>
                  <div>
                    <span>Início real</span>
                    <strong>{formatDateTime(workOrder.actual_started_at)}</strong>
                  </div>
                  <div>
                    <span>Fim real</span>
                    <strong>{formatDateTime(workOrder.actual_finished_at)}</strong>
                  </div>
                  <div>
                    <span>Duração calendário</span>
                    <strong>{formatMinutes(report?.calendar_duration_minutes ?? null)}</strong>
                  </div>
                  <div>
                    <span>Horas apontadas</span>
                    <strong>{formatMinutes(workOrder.total_labor_minutes)}</strong>
                  </div>
                  <div>
                    <span>Resultado</span>
                    <strong>{getFinalResultLabel(workOrder.result)}</strong>
                  </div>
                  <div>
                    <span>Fechada por</span>
                    <strong>{formatValue(workOrder.closed_by_name)}</strong>
                  </div>
                  <div>
                    <span>Fechada em</span>
                    <strong>{formatDateTime(workOrder.closed_at)}</strong>
                  </div>
                  <div>
                    <span>Anexos</span>
                    <strong>{attachments.length || workOrder.attachments_count}</strong>
                  </div>
                </div>

                <div className={styles.textStack}>
                  <div className={styles.textBlock}>
                    <span>Descrição da execução</span>
                    <p>{workOrder.execution_description || "-"}</p>
                  </div>
                  <div className={styles.textBlock}>
                    <span>Causa identificada</span>
                    <p>{workOrder.identified_cause || "-"}</p>
                  </div>
                  <div className={styles.textBlock}>
                    <span>Solução aplicada</span>
                    <p>{workOrder.solution_applied || "-"}</p>
                  </div>
                  <div className={styles.textBlock}>
                    <span>Materiais utilizados</span>
                    <p>{report?.materials_used || "-"}</p>
                  </div>
                  <div className={styles.textBlock}>
                    <span>Observações internas</span>
                    <p>{report?.internal_notes || "-"}</p>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <h3>
                  <Paperclip size={17} />
                  Anexos / evidências
                </h3>

                {attachments.length > 0 ? (
                  <div className={styles.compactList}>
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className={styles.compactItem}>
                        <strong>{attachment.file_name}</strong>
                        <span>
                          {attachment.attachment_type} · {formatValue(attachment.mime_type)} · {formatDateTime(attachment.created_at)}
                        </span>
                        <span>Enviado por: {formatValue(attachment.uploaded_by_name)}</span>
                        {attachment.description && <p>{attachment.description}</p>}
                        <span className={styles.pathText}>{attachment.file_path}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>Nenhum anexo carregado.</p>
                )}
              </section>

              <section className={styles.section}>
                <h3>
                  <BadgeCheck size={17} />
                  Validações
                </h3>

                {validations.length > 0 ? (
                  <div className={styles.compactList}>
                    {validations.map((validation) => (
                      <div key={validation.id} className={styles.compactItem}>
                        <div className={styles.itemHeader}>
                          <strong>{getValidationResultLabel(validation.validation_result)}</strong>
                          <span className={`${styles.smallBadge} ${styles[validation.validation_result]}`}>
                            {validation.validation_type}
                          </span>
                        </div>
                        <span>
                          Por: {formatValue(validation.validated_by_name)} · Em: {formatDateTime(validation.created_at)}
                        </span>
                        {validation.rejection_reason && (
                          <p><strong>Motivo:</strong> {validation.rejection_reason}</p>
                        )}
                        {validation.comment && <p><strong>Comentário:</strong> {validation.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>Nenhuma validação registrada.</p>
                )}
              </section>
            </div>
  );
}
