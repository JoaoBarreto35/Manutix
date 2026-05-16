import type { ReactNode } from "react";
import { ClipboardList, FileText, History, Wrench } from "lucide-react";

import type { WorkOrderListItem, WorkOrderReportHistory, WorkOrderReportPreventive, WorkOrderReportServiceRequest } from "../../../../../../types/workOrder";
import { formatValue, getOriginLabel } from "../../helpers";
import { formatDateTime } from "../../../../utils/workOrderFormatters";
import styles from "../../styles.module.css";

type RequestTabProps = {
  workOrder: WorkOrderListItem;
  serviceRequest: WorkOrderReportServiceRequest | null;
  preventive: WorkOrderReportPreventive | null;
  history: WorkOrderReportHistory[];
  renderHistoryDetails: (item: WorkOrderReportHistory) => ReactNode;
};

export function RequestTab({
  workOrder,
  serviceRequest,
  preventive,
  history,
  renderHistoryDetails,
}: RequestTabProps) {
  return (
            <div className={styles.tabPanel}>
              <section className={styles.section}>
                <h3>
                  <ClipboardList size={17} />
                  Solicitação / origem
                </h3>

                <div className={styles.infoGrid}>
                  <div>
                    <span>Origem</span>
                    <strong>{getOriginLabel(workOrder)}</strong>
                  </div>
                  <div>
                    <span>Criada por</span>
                    <strong>{formatValue(workOrder.created_by_name)}</strong>
                  </div>
                  <div>
                    <span>Criada em</span>
                    <strong>{formatDateTime(workOrder.created_at)}</strong>
                  </div>
                  <div>
                    <span>Atualizada em</span>
                    <strong>{formatDateTime(workOrder.updated_at)}</strong>
                  </div>
                </div>
              </section>

              {serviceRequest && (
                <section className={styles.section}>
                  <h3>
                    <FileText size={17} />
                    Chamado de origem
                  </h3>

                  <div className={styles.infoGrid}>
                    <div>
                      <span>Código</span>
                      <strong>{serviceRequest.code}</strong>
                    </div>
                    <div>
                      <span>Solicitante</span>
                      <strong>{formatValue(serviceRequest.opened_by_name)}</strong>
                    </div>
                    <div>
                      <span>Problema padrão</span>
                      <strong>{formatValue(serviceRequest.problem)}</strong>
                    </div>
                    <div>
                      <span>Abertura</span>
                      <strong>{formatDateTime(serviceRequest.created_at)}</strong>
                    </div>
                  </div>

                  <div className={styles.textStack}>
                    {serviceRequest.problem_other_text && (
                      <div className={styles.textBlock}>
                        <span>Complemento / outro problema</span>
                        <p>{serviceRequest.problem_other_text}</p>
                      </div>
                    )}
                    <div className={styles.textBlock}>
                      <span>Descrição original</span>
                      <p>{serviceRequest.description}</p>
                    </div>
                  </div>
                </section>
              )}

              {preventive && (
                <section className={styles.section}>
                  <h3>
                    <Wrench size={17} />
                    Preventiva de origem
                  </h3>

                  <div className={styles.infoGrid}>
                    <div>
                      <span>Plano</span>
                      <strong>{preventive.plan_name}</strong>
                    </div>
                    <div>
                      <span>Tarefa</span>
                      <strong>{preventive.task_name}</strong>
                    </div>
                    <div>
                      <span>Vencimento</span>
                      <strong>{formatDateTime(preventive.due_at)}</strong>
                    </div>
                    <div>
                      <span>Data prevista</span>
                      <strong>{formatValue(preventive.due_date)}</strong>
                    </div>
                  </div>
                </section>
              )}

              {!serviceRequest && !preventive && (
                <section className={styles.section}>
                  <h3>
                    <FileText size={17} />
                    Atividade interna
                  </h3>
                  <div className={styles.textBlock}>
                    <span>Descrição</span>
                    <p>{workOrder.description || "Sem descrição."}</p>
                  </div>
                </section>
              )}

              <section className={styles.section}>
                <h3>
                  <History size={17} />
                  Histórico
                </h3>

                {history.length > 0 ? (
                  <div className={styles.timeline}>
                    {history.map((item) => (
                      <div key={item.id} className={styles.timelineItem}>
                        <strong>{item.action}</strong>
                        <span>
                          {formatValue(item.performed_by_name)} · {formatDateTime(item.created_at)}
                        </span>
                        {item.reason && <small>Motivo: {item.reason}</small>}
                        {renderHistoryDetails(item)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.muted}>Nenhum histórico carregado.</p>
                )}
              </section>
            </div>
  );
}
