import type { WorkspaceOperationalMember } from "../../../../services/workspaceMemberService";
import type {
  CompleteWorkOrderTaskInput,
  FinalResult,
  WorkOrderListItem,
  WorkOrderReportTask,
  WorkOrderValidationResult,
} from "../../../../types/workOrder";
import { finalResultLabels, validationResultLabels } from "../../constants/workOrderLabels";
import type { TaskCompletionDraft } from "./types";

const roleLabels: Record<WorkspaceOperationalMember["role"], string> = {
  admin: "Admin",
  manager: "Gestor",
  planner: "Planejador",
  technician: "Técnico",
  client: "Cliente",
};

export function isBlank(value: string | number | null | undefined) {
  return value === null || value === undefined || String(value).trim() === "";
}

export function isInvalidPositiveNumber(value: string | number | null | undefined) {
  if (isBlank(value)) return true;
  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) || parsedValue <= 0;
}

export function formatValue(value: string | number | null | undefined) {
  if (isBlank(value)) {
    return "-";
  }

  return String(value);
}

export function formatBoolean(value: boolean | null | undefined) {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  return "-";
}

export function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function toIsoFromLocalInput(value: string) {
  return new Date(value).toISOString();
}

export function getRequiredTasksProgressPercent(workOrder: WorkOrderListItem) {
  const progressPercent = Number(workOrder.required_tasks_progress_percent ?? 0);

  if (Number.isNaN(progressPercent)) return 0;

  return Math.max(0, Math.min(100, Math.round(progressPercent)));
}

export function getOriginLabel(workOrder: WorkOrderListItem) {
  if (workOrder.origin === "service_request") {
    return workOrder.service_request_code
      ? `Chamado ${workOrder.service_request_code}`
      : "Chamado";
  }

  if (workOrder.origin === "preventive_plan") {
    return workOrder.preventive_plan_name
      ? `Preventiva · ${workOrder.preventive_plan_name}`
      : "Preventiva";
  }

  return "Interna";
}

export function getTaskStatusLabel(status: WorkOrderReportTask["status"]) {
  if (status === "completed") return "Concluída";
  if (status === "not_applicable") return "Não aplicável";
  return "Pendente";
}

export function getValidationResultLabel(result: WorkOrderValidationResult) {
  return validationResultLabels[result] ?? result;
}

export function getFinalResultLabel(result: FinalResult | null | undefined) {
  if (!result) return "-";
  return finalResultLabels[result] ?? result;
}

export function formatJsonValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function getMemberLabel(member: WorkspaceOperationalMember) {
  const name = member.fullName?.trim() || member.email || "Usuário sem nome";
  return `${name} · ${roleLabels[member.role]}`;
}

export function createEmptyTaskDraft(): TaskCompletionDraft {
  return {
    answerText: "",
    answerNumber: "",
    answerBoolean: "true",
    complianceStatus: "conforme",
    notApplicableReason: "",
  };
}

export function getTaskCompletionPayload(
  task: WorkOrderReportTask,
  draft: TaskCompletionDraft
): CompleteWorkOrderTaskInput {
  if (task.response_type === "text") {
    return {
      taskId: task.id,
      answerText: draft.answerText.trim() || "Concluído.",
      answerNumber: null,
      answerBoolean: null,
      complianceResult: null,
    };
  }

  if (task.response_type === "number") {
    return {
      taskId: task.id,
      answerText: null,
      answerNumber: draft.answerNumber.trim() ? Number(draft.answerNumber) : null,
      answerBoolean: null,
      complianceResult: null,
    };
  }

  if (task.response_type === "boolean") {
    return {
      taskId: task.id,
      answerText: null,
      answerNumber: null,
      answerBoolean: draft.answerBoolean === "true",
      complianceResult: null,
    };
  }

  if (task.response_type === "compliance") {
    const complianceStatus = draft.complianceStatus || "conforme";

    return {
      taskId: task.id,
      answerText: complianceStatus,
      answerNumber: null,
      answerBoolean: null,
      complianceResult:
        complianceStatus === "conforme" ||
        complianceStatus === "nao_conforme_corrigido",
    };
  }

  return {
    taskId: task.id,
    answerText: task.response_type === "photo" ? "Evidência anexada/confirmada." : null,
    answerNumber: null,
    answerBoolean: true,
    complianceResult: null,
  };
}
