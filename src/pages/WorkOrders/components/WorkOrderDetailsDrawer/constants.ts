import type { MaintenanceType, PriorityLevel, TaskResponseType } from "../../../../types/workOrder";

export type DrawerTab = "overview" | "request" | "tasks" | "execution";

export type DrawerTabConfig = {
  id: DrawerTab;
  label: string;
};

export const drawerTabs: DrawerTabConfig[] = [
  { id: "overview", label: "Resumo" },
  { id: "request", label: "Solicitação" },
  { id: "tasks", label: "Subtarefas" },
  { id: "execution", label: "Execução" },
];

export const priorityOptions: PriorityLevel[] = ["low", "medium", "high", "critical"];

export const maintenanceTypeOptions: MaintenanceType[] = [
  "corrective",
  "preventive",
  "inspection",
  "improvement",
  "emergency",
];

export const taskResponseTypeOptions: TaskResponseType[] = [
  "checkbox",
  "text",
  "number",
  "boolean",
  "compliance",
  "photo",
];
