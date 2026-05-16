import type { WorkOrderListItem } from "../../../types/workOrder";

export type WorkOrderQuickAction =
  | "plan"
  | "release"
  | "execute"
  | "finish_participation"
  | "validate"
  | "replan"
  | "finish"
  | "details";

export type WorkOrderPrimaryAction = {
  action: WorkOrderQuickAction;
  label: string;
  title: string;
};

function hasCompletedRequiredTasks(order: WorkOrderListItem): boolean {
  return (order.required_tasks_progress_percent ?? 0) >= 100;
}

function hasOpenTimeLog(order: WorkOrderListItem): boolean {
  return (order.open_time_logs_count ?? 0) > 0;
}

export function getWorkOrderPrimaryAction(
  order: WorkOrderListItem
): WorkOrderPrimaryAction | null {
  switch (order.status) {
    case "waiting_planning":
      return {
        action: "plan",
        label: "Programar",
        title: "Programar responsável, equipe e datas da OS",
      };
    case "planned":
      return {
        action: "release",
        label: "Liberar",
        title: "Liberar OS para execução",
      };
    case "released":
      return {
        action: "execute",
        label: "Executar",
        title: "Iniciar execução da OS",
      };
    case "in_execution":
      if (order.current_user_has_open_time_log) {
        return {
          action: "finish_participation",
          label: "Finalizar participação",
          title: "Encerrar seu apontamento aberto antes de finalizar a OS",
        };
      }

      if (hasCompletedRequiredTasks(order) && !hasOpenTimeLog(order)) {
        return {
          action: "finish",
          label: "Finalizar OS",
          title: "Finalizar OS e enviar para validação ou fechamento",
        };
      }

      return null;
    case "paused":
      if (order.current_user_has_open_time_log) {
        return {
          action: "finish_participation",
          label: "Finalizar participação",
          title: "Encerrar seu apontamento aberto antes de finalizar a OS",
        };
      }

      if (hasCompletedRequiredTasks(order) && !hasOpenTimeLog(order)) {
        return {
          action: "finish",
          label: "Finalizar OS",
          title: "Finalizar OS e enviar para validação ou fechamento",
        };
      }

      return {
        action: "execute",
        label: "Retomar",
        title: "Retomar execução da OS",
      };
    case "waiting_validation":
      return {
        action: "validate",
        label: "Validar",
        title: "Aprovar ou reprovar a OS",
      };
    case "rejected_by_client":
      return {
        action: "replan",
        label: "Replanejar",
        title: "Reabrir OS reprovada para planejamento",
      };
    case "closed":
    case "cancelled":
    default:
      return {
        action: "details",
        label: "Ver",
        title: "Ver detalhes da OS",
      };
  }
}
