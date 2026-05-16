import type { WorkOrderStatus } from "../../../types/workOrder";

const planningStatuses: WorkOrderStatus[] = [
  "waiting_planning",
  "planned",
  "rejected_by_client",
];

const executionStatuses: WorkOrderStatus[] = [
  "planned",
  "released",
  "in_execution",
  "paused",
];

export function canEditWorkOrderDetails(status: WorkOrderStatus): boolean {
  return planningStatuses.includes(status);
}

export function canEditPlanning(status: WorkOrderStatus): boolean {
  return planningStatuses.includes(status);
}

export function canEditTaskStructure(status: WorkOrderStatus): boolean {
  return planningStatuses.includes(status);
}

export function canFillTaskResponses(status: WorkOrderStatus): boolean {
  return ["released", "in_execution", "paused"].includes(status);
}

export function canExecuteWorkOrder(status: WorkOrderStatus): boolean {
  return executionStatuses.includes(status);
}

export function canValidateWorkOrder(status: WorkOrderStatus): boolean {
  return status === "waiting_validation";
}

export function isReadOnlyWorkOrder(status: WorkOrderStatus): boolean {
  return status === "closed" || status === "cancelled";
}
