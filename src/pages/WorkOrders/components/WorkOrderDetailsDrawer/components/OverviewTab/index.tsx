import type { Dispatch, FormEvent, SetStateAction } from "react";
import { CalendarClock, FileText, ListChecks, MapPin, Save } from "lucide-react";

import { Button } from "../../../../../../components/Button";
import type { MaintenanceType, PriorityLevel, WorkOrderListItem, WorkOrderReportAssignment, WorkOrderReportAttachment, WorkOrderReportTask } from "../../../../../../types/workOrder";
import type { WorkspaceOperationalMember } from "../../../../../../services/workspaceMemberService";
import { maintenanceTypeLabels, priorityLabels, statusLabels } from "../../../../constants/workOrderLabels";
import { maintenanceTypeOptions, priorityOptions } from "../../constants";
import { getMemberLabel, getOriginLabel, isBlank, isInvalidPositiveNumber } from "../../helpers";
import { formatDateTime, formatMinutes } from "../../../../utils/workOrderFormatters";
import styles from "../../styles.module.css";

type OverviewTabProps = {
  workOrder: WorkOrderListItem;
  assignments: WorkOrderReportAssignment[];
  tasks: WorkOrderReportTask[];
  attachments: WorkOrderReportAttachment[];
  completedTasks: number;
  requiredTasks: number;
  completedRequiredTasks: number;
  requiredProgressPercent: number;
  detailsEditable: boolean;
  planningEditable: boolean;
  editingDetails: boolean;
  setEditingDetails: (value: boolean) => void;
  editingPlanning: boolean;
  setEditingPlanning: (value: boolean) => void;
  detailsTitle: string;
  setDetailsTitle: (value: string) => void;
  detailsDescription: string;
  setDetailsDescription: (value: string) => void;
  detailsPriority: PriorityLevel;
  setDetailsPriority: (value: PriorityLevel) => void;
  detailsMaintenanceType: MaintenanceType;
  setDetailsMaintenanceType: (value: MaintenanceType) => void;
  detailsReason: string;
  setDetailsReason: (value: string) => void;
  savingDetails: boolean;
  handleDetailsSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  members: WorkspaceOperationalMember[];
  technicianMembers: WorkspaceOperationalMember[];
  loadingMembers: boolean;
  savingPlanning: boolean;
  planningPrimaryUserId: string;
  setPlanningPrimaryUserId: (value: string) => void;
  planningSupportUserIds: string[];
  setPlanningSupportUserIds: Dispatch<SetStateAction<string[]>>;
  togglePlanningSupportUser: (userId: string) => void;
  planningStartAt: string;
  setPlanningStartAt: (value: string) => void;
  planningEndAt: string;
  setPlanningEndAt: (value: string) => void;
  planningEstimatedMinutes: number;
  setPlanningEstimatedMinutes: (value: number) => void;
  planningReason: string;
  setPlanningReason: (value: string) => void;
  handlePlanningSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  requiredFieldClassName: (missingRequiredValue: boolean) => string | undefined;
};

export function OverviewTab({
  workOrder,
  assignments,
  tasks,
  attachments,
  completedTasks,
  requiredTasks,
  completedRequiredTasks,
  requiredProgressPercent,
  detailsEditable,
  planningEditable,
  editingDetails,
  setEditingDetails,
  editingPlanning,
  setEditingPlanning,
  detailsTitle,
  setDetailsTitle,
  detailsDescription,
  setDetailsDescription,
  detailsPriority,
  setDetailsPriority,
  detailsMaintenanceType,
  setDetailsMaintenanceType,
  detailsReason,
  setDetailsReason,
  savingDetails,
  handleDetailsSubmit,
  members,
  technicianMembers,
  loadingMembers,
  savingPlanning,
  planningPrimaryUserId,
  setPlanningPrimaryUserId,
  planningSupportUserIds,
  setPlanningSupportUserIds,
  togglePlanningSupportUser,
  planningStartAt,
  setPlanningStartAt,
  planningEndAt,
  setPlanningEndAt,
  planningEstimatedMinutes,
  setPlanningEstimatedMinutes,
  planningReason,
  setPlanningReason,
  handlePlanningSubmit,
  requiredFieldClassName,
}: OverviewTabProps) {
  return (
            <div className={styles.tabPanel}>
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>
                    <FileText size={17} />
                    Dados principais
                  </h3>

                  {detailsEditable && !editingDetails && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingDetails(true)}
                    >
                      Editar
                    </Button>
                  )}
                </div>

                {editingDetails ? (
                  <form className={styles.editForm} onSubmit={handleDetailsSubmit}>
                    <label className={styles.fullField}>
                      Título
                      <input
                        className={requiredFieldClassName(isBlank(detailsTitle))}
                        value={detailsTitle}
                        onChange={(event) => setDetailsTitle(event.target.value)}
                        required
                      />
                    </label>

                    <label className={styles.fullField}>
                      Descrição
                      <textarea
                        value={detailsDescription}
                        onChange={(event) => setDetailsDescription(event.target.value)}
                        rows={4}
                      />
                    </label>

                    <label>
                      Prioridade
                      <select
                        value={detailsPriority}
                        onChange={(event) =>
                          setDetailsPriority(event.target.value as PriorityLevel)
                        }
                      >
                        {priorityOptions.map((priority) => (
                          <option key={priority} value={priority}>
                            {priorityLabels[priority]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Tipo de manutenção
                      <select
                        value={detailsMaintenanceType}
                        onChange={(event) =>
                          setDetailsMaintenanceType(event.target.value as MaintenanceType)
                        }
                      >
                        {maintenanceTypeOptions.map((maintenanceType) => (
                          <option key={maintenanceType} value={maintenanceType}>
                            {maintenanceTypeLabels[maintenanceType]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.fullField}>
                      Motivo da alteração
                      <textarea
                        value={detailsReason}
                        onChange={(event) => setDetailsReason(event.target.value)}
                        rows={2}
                        placeholder="Ex: ajuste de escopo após revisão do planejamento."
                      />
                    </label>

                    <div className={styles.formActions}>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditingDetails(false)}
                        disabled={savingDetails}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" variant="primary" loading={savingDetails}>
                        <Save size={16} />
                        Salvar dados
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    {!detailsEditable && (
                      <p className={styles.readOnlyNotice}>
                        Dados principais ficam bloqueados após liberação para execução.
                      </p>
                    )}

                    <div className={styles.textBlock}>
                      <span>Descrição da OS</span>
                      <p>{workOrder.description || "Sem descrição."}</p>
                    </div>

                    <div className={styles.infoGrid}>
                      <div>
                        <span>Prioridade</span>
                        <strong>{priorityLabels[workOrder.priority]}</strong>
                      </div>
                      <div>
                        <span>Tipo</span>
                        <strong>{maintenanceTypeLabels[workOrder.maintenance_type]}</strong>
                      </div>
                      <div>
                        <span>Status</span>
                        <strong>{statusLabels[workOrder.status]}</strong>
                      </div>
                      <div>
                        <span>Origem</span>
                        <strong>{getOriginLabel(workOrder)}</strong>
                      </div>
                    </div>
                  </>
                )}
              </section>

              <section className={styles.section}>
                <h3>
                  <MapPin size={17} />
                  Ativo / local
                </h3>

                <div className={styles.infoGrid}>
                  <div>
                    <span>Código</span>
                    <strong>{workOrder.asset_code}</strong>
                  </div>
                  <div>
                    <span>Nome</span>
                    <strong>{workOrder.asset_name}</strong>
                  </div>
                  <div>
                    <span>Tipo</span>
                    <strong>{workOrder.asset_type_name}</strong>
                  </div>
                  <div>
                    <span>Criticidade</span>
                    <strong>{workOrder.asset_criticality}</strong>
                  </div>
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>
                    <CalendarClock size={17} />
                    Planejamento / equipe
                  </h3>

                  {planningEditable && !editingPlanning && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingPlanning(true)}
                    >
                      Editar planejamento
                    </Button>
                  )}
                </div>

                {editingPlanning ? (
                  <form className={styles.editForm} onSubmit={handlePlanningSubmit}>
                    <label className={styles.fullField}>
                      Responsável principal
                      <select
                        className={requiredFieldClassName(isBlank(planningPrimaryUserId))}
                        value={planningPrimaryUserId}
                        onChange={(event) => {
                          const nextPrimaryUserId = event.target.value;
                          setPlanningPrimaryUserId(nextPrimaryUserId);
                          setPlanningSupportUserIds((current) =>
                            current.filter((userId) => userId !== nextPrimaryUserId)
                          );
                        }}
                        disabled={loadingMembers || savingPlanning}
                        required
                      >
                        <option value="">
                          {loadingMembers
                            ? "Carregando membros..."
                            : "Selecione um responsável"}
                        </option>
                        {members.map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {getMemberLabel(member)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <fieldset className={styles.fullField}>
                      <legend>Equipe de apoio</legend>
                      <p className={styles.muted}>
                        Apenas técnicos podem entrar como apoio de execução.
                      </p>

                      {technicianMembers.length > 0 ? (
                        <div className={styles.checkboxGroup}>
                          {technicianMembers.map((member) => (
                            <label key={member.userId} className={styles.checkboxOption}>
                              <input
                                type="checkbox"
                                checked={planningSupportUserIds.includes(member.userId)}
                                disabled={
                                  savingPlanning || member.userId === planningPrimaryUserId
                                }
                                onChange={() => togglePlanningSupportUser(member.userId)}
                              />
                              <span>{getMemberLabel(member)}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.muted}>Nenhum técnico ativo encontrado.</p>
                      )}
                    </fieldset>

                    <label>
                      Início programado
                      <input
                        className={requiredFieldClassName(isBlank(planningStartAt))}
                        type="datetime-local"
                        value={planningStartAt}
                        onChange={(event) => setPlanningStartAt(event.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Fim programado
                      <input
                        className={requiredFieldClassName(isBlank(planningEndAt))}
                        type="datetime-local"
                        value={planningEndAt}
                        onChange={(event) => setPlanningEndAt(event.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Duração estimada em minutos
                      <input
                        className={requiredFieldClassName(isInvalidPositiveNumber(planningEstimatedMinutes))}
                        type="number"
                        min={1}
                        value={planningEstimatedMinutes}
                        onChange={(event) =>
                          setPlanningEstimatedMinutes(Number(event.target.value))
                        }
                        required
                      />
                    </label>

                    <label className={styles.fullField}>
                      Motivo / observação
                      <textarea
                        value={planningReason}
                        onChange={(event) => setPlanningReason(event.target.value)}
                        rows={2}
                      />
                    </label>

                    <div className={styles.formActions}>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditingPlanning(false)}
                        disabled={savingPlanning}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" variant="primary" loading={savingPlanning}>
                        <Save size={16} />
                        Salvar planejamento
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    {!planningEditable && (
                      <p className={styles.readOnlyNotice}>
                        Planejamento e equipe ficam bloqueados após liberação.
                      </p>
                    )}

                    <div className={styles.infoGrid}>
                      <div>
                        <span>Responsável</span>
                        <strong>{workOrder.primary_user_name || "Não definido"}</strong>
                      </div>
                      <div>
                        <span>Equipe</span>
                        <strong>{workOrder.assigned_users_count}</strong>
                      </div>
                      <div>
                        <span>Início programado</span>
                        <strong>{formatDateTime(workOrder.scheduled_start_at)}</strong>
                      </div>
                      <div>
                        <span>Fim programado</span>
                        <strong>{formatDateTime(workOrder.scheduled_end_at)}</strong>
                      </div>
                      <div>
                        <span>Prazo calculado</span>
                        <strong>{formatDateTime(workOrder.calculated_due_at)}</strong>
                      </div>
                      <div>
                        <span>Tempo estimado</span>
                        <strong>{formatMinutes(workOrder.estimated_duration_minutes)}</strong>
                      </div>
                    </div>

                    {assignments.length > 0 && (
                      <details className={styles.collapseBlock}>
                        <summary>Ver equipe detalhada</summary>
                        <div className={styles.compactList}>
                          {assignments.map((assignment) => (
                            <div key={assignment.assignment_id} className={styles.compactItem}>
                              <strong>{assignment.user_name || "Usuário sem nome"}</strong>
                              <span>
                                {assignment.is_primary ? "Responsável principal" : "Apoio"} · {assignment.role} · {assignment.status}
                              </span>
                              <span>
                                Estimado: {formatMinutes(assignment.estimated_minutes)} · Apontado: {formatMinutes(assignment.total_minutes)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                )}
              </section>

              <section className={styles.section}>
                <h3>
                  <ListChecks size={17} />
                  Progresso
                </h3>

                <div className={styles.progressCard}>
                  <div>
                    <span>Checklist obrigatório</span>
                    <strong>{requiredProgressPercent}%</strong>
                  </div>
                  <div className={styles.progressSummary}>
                    <div className={styles.progressTrack}>
                      <span style={{ width: `${requiredProgressPercent}%` }} />
                    </div>
                  </div>
                </div>

                <div className={styles.infoGrid}>
                  <div>
                    <span>Obrigatórias</span>
                    <strong>{completedRequiredTasks}/{requiredTasks}</strong>
                  </div>
                  <div>
                    <span>Total concluídas</span>
                    <strong>{completedTasks}/{tasks.length || workOrder.tasks_count}</strong>
                  </div>
                  <div>
                    <span>Horas apontadas</span>
                    <strong>{formatMinutes(workOrder.total_labor_minutes)}</strong>
                  </div>
                  <div>
                    <span>Anexos</span>
                    <strong>{attachments.length || workOrder.attachments_count}</strong>
                  </div>
                </div>
              </section>
            </div>
  );
}
