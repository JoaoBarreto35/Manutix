import type { FormEvent } from "react";
import { CalendarClock } from "lucide-react";
import type { WorkOrderListItem } from "../../../../types/workOrder";
import type { WorkspaceOperationalMember } from "../../../../services/workspaceMemberService";
import { Button } from "../../../../components/Button";
import styles from "../../styles.module.css";

type WorkOrderPlanningPanelProps = {
  workOrder: WorkOrderListItem | null;
  members: WorkspaceOperationalMember[];
  loadingMembers: boolean;
  selectedPrimaryUserId: string;
  selectedSupportUserIds: string[];
  scheduledStartAt: string;
  scheduledEndAt: string;
  estimatedDurationMinutes: number;
  planningNote: string;
  planning: boolean;
  onSelectedPrimaryUserIdChange: (value: string) => void;
  onSelectedSupportUserIdsChange: (value: string[]) => void;
  onScheduledStartAtChange: (value: string) => void;
  onScheduledEndAtChange: (value: string) => void;
  onEstimatedDurationMinutesChange: (value: number) => void;
  onPlanningNoteChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const roleLabels: Record<WorkspaceOperationalMember["role"], string> = {
  admin: "Admin",
  manager: "Gestor",
  planner: "Planejador",
  technician: "Técnico",
  client: "Cliente",
};

function getMemberLabel(member: WorkspaceOperationalMember) {
  const name = member.fullName?.trim() || member.email || "Usuário sem nome";

  return `${name} · ${roleLabels[member.role]}`;
}

export function WorkOrderPlanningPanel({
  workOrder,
  members,
  loadingMembers,
  selectedPrimaryUserId,
  selectedSupportUserIds,
  scheduledStartAt,
  scheduledEndAt,
  estimatedDurationMinutes,
  planningNote,
  planning,
  onSelectedPrimaryUserIdChange,
  onSelectedSupportUserIdsChange,
  onScheduledStartAtChange,
  onScheduledEndAtChange,
  onEstimatedDurationMinutesChange,
  onPlanningNoteChange,
  onClose,
  onSubmit,
}: WorkOrderPlanningPanelProps) {
  if (!workOrder) return null;

  const technicianMembers = members.filter(
    (member) => member.role === "technician"
  );

  function handleSupportUserToggle(userId: string) {
    const nextSupportUserIds = selectedSupportUserIds.includes(userId)
      ? selectedSupportUserIds.filter((selectedUserId) => selectedUserId !== userId)
      : [...selectedSupportUserIds, userId];

    onSelectedSupportUserIdsChange(nextSupportUserIds);
  }

  return (
    <section className={styles.formCard}>
      <div className={styles.formHeader}>
        <div>
          <span>Planejamento</span>
          <h2>Planejar OS {workOrder.work_order_code}</h2>
          <p>
            {workOrder.asset_code} - {workOrder.asset_name}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className={styles.form}>
        <label>
          Responsável principal
          <select
            value={selectedPrimaryUserId}
            onChange={(event) => {
              const nextPrimaryUserId = event.target.value;

              onSelectedPrimaryUserIdChange(nextPrimaryUserId);
              onSelectedSupportUserIdsChange(
                selectedSupportUserIds.filter(
                  (supportUserId) => supportUserId !== nextPrimaryUserId
                )
              );
            }}
            disabled={loadingMembers || planning}
            required
          >
            <option value="">
              {loadingMembers ? "Carregando membros..." : "Selecione um responsável"}
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
          <p className={styles.helpText}>
            Selecione apenas técnicos que também participarão da execução.
          </p>

          {loadingMembers && <p>Carregando técnicos...</p>}

          {!loadingMembers && technicianMembers.length === 0 && (
            <p>Nenhum técnico ativo encontrado neste workspace.</p>
          )}

          {!loadingMembers && technicianMembers.length > 0 && (
            <div className={styles.checkboxGroup}>
              {technicianMembers.map((member) => (
                <label key={member.userId} className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={selectedSupportUserIds.includes(member.userId)}
                    disabled={
                      planning || member.userId === selectedPrimaryUserId
                    }
                    onChange={() => handleSupportUserToggle(member.userId)}
                  />
                  <span>{getMemberLabel(member)}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <label>
          Início programado
          <input
            type="datetime-local"
            value={scheduledStartAt}
            onChange={(event) => onScheduledStartAtChange(event.target.value)}
            required
          />
        </label>

        <label>
          Fim programado
          <input
            type="datetime-local"
            value={scheduledEndAt}
            onChange={(event) => onScheduledEndAtChange(event.target.value)}
            required
          />
        </label>

        <label>
          Duração estimada em minutos
          <input
            type="number"
            min={1}
            value={estimatedDurationMinutes}
            onChange={(event) =>
              onEstimatedDurationMinutesChange(Number(event.target.value))
            }
            required
          />
        </label>

        <label className={styles.fullField}>
          Observação do planejamento
          <textarea
            value={planningNote}
            onChange={(event) => onPlanningNoteChange(event.target.value)}
            rows={3}
            placeholder="Ex: Programado para inspeção no início do turno."
          />
        </label>

        <div className={styles.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="submit" variant="primary" loading={planning}>
            <CalendarClock size={16} />
            {planning ? "Planejando..." : "Salvar planejamento"}
          </Button>
        </div>
      </form>
    </section>
  );
}
