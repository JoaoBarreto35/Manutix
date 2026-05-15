import type {
  FinalResult,
  MaintenanceType,
  PriorityLevel,
  TaskResponseType,
  WorkOrderStatus,
  WorkOrderOrigin,
  WorkOrderValidationResult,
} from "../../../types/workOrder";

export type StatusFilter = WorkOrderStatus | "all";

export const workOrderStatusOrder: WorkOrderStatus[] = [
  "waiting_planning",
  "planned",
  "released",
  "in_execution",
  "paused",
  "waiting_validation",
  "rejected_by_client",
  "closed",
  "cancelled",
];


export type WorkOrderKanbanGroupId =
  | "to_plan"
  | "scheduled"
  | "execution"
  | "validation"
  | "closed";

export type WorkOrderKanbanGroup = {
  id: WorkOrderKanbanGroupId;
  title: string;
  description: string;
  statuses: WorkOrderStatus[];
  isClosedGroup?: boolean;
};

export const workOrderKanbanGroups: WorkOrderKanbanGroup[] = [
  {
    id: "to_plan",
    title: "A planejar",
    description: "OS aguardando planejamento ou reprovadas para replanejamento.",
    statuses: ["waiting_planning", "rejected_by_client"],
  },
  {
    id: "scheduled",
    title: "Programadas",
    description: "OS planejadas ou liberadas para execução.",
    statuses: ["planned", "released"],
  },
  {
    id: "execution",
    title: "Em execução",
    description: "OS em andamento ou pausadas.",
    statuses: ["in_execution", "paused"],
  },
  {
    id: "validation",
    title: "Em validação",
    description: "OS aguardando aprovação do cliente ou gestão.",
    statuses: ["waiting_validation"],
  },
  {
    id: "closed",
    title: "Encerradas",
    description: "OS fechadas ou canceladas.",
    statuses: ["closed", "cancelled"],
    isClosedGroup: true,
  },
];


export const originLabels: Record<WorkOrderOrigin, string> = {
  service_request: "Chamado",
  internal: "Interna",
  preventive_plan: "Preventiva",
};

export const originShortLabels: Record<WorkOrderOrigin, string> = {
  service_request: "CH",
  internal: "IN",
  preventive_plan: "PV",
};

export const scheduleHealthLabels: Record<WorkOrderListItemScheduleHealth, string> = {
  completed_on_time: "Concluída no prazo",
  completed_late: "Concluída com atraso",
  overdue: "Atrasada",
  unscheduled: "Sem programação",
  scheduled_late: "Programada após o prazo",
  due_today: "Vence hoje",
  scheduled_on_time: "No prazo",
};

export type WorkOrderListItemScheduleHealth =
  | "completed_on_time"
  | "completed_late"
  | "overdue"
  | "unscheduled"
  | "scheduled_late"
  | "due_today"
  | "scheduled_on_time";

export const statusLabels: Record<WorkOrderStatus, string> = {
  waiting_planning: "Aguardando planejamento",
  planned: "Planejada",
  released: "Liberada",
  in_execution: "Em execução",
  paused: "Pausada",
  waiting_validation: "Aguardando validação",
  rejected_by_client: "Rejeitada pelo cliente",
  closed: "Fechada",
  cancelled: "Cancelada",
};

export const priorityLabels: Record<PriorityLevel, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  corrective: "Corretiva",
  preventive: "Preventiva",
  inspection: "Inspeção",
  improvement: "Melhoria",
  emergency: "Emergência",
};

export const responseTypeLabels: Record<TaskResponseType, string> = {
  checkbox: "Checkbox",
  text: "Texto",
  number: "Número",
  boolean: "Sim/Não",
  compliance: "Conformidade",
  photo: "Foto",
};

export const finalResultLabels: Record<FinalResult, string> = {
  resolved: "Resolvido",
  partially_resolved: "Parcialmente resolvido",
  not_resolved: "Não resolvido",
  not_applicable: "Não aplicável",
  requires_new_work_order: "Requer nova OS",
};

export const validationResultLabels: Record<WorkOrderValidationResult, string> = {
  approved: "Aprovada",
  rejected: "Reprovada",
};
