import type { WorkspaceOperationalMember } from "../../../../services/workspaceMemberService";
import type {
  AddWorkOrderTaskInput,
  CompleteWorkOrderTaskInput,
  DeleteWorkOrderTaskInput,
  FinishWorkOrderInput,
  FinishWorkOrderParticipationInput,
  MarkWorkOrderTaskNotApplicableInput,
  PlanWorkOrderInput,
  ReleaseWorkOrderInput,
  ReopenRejectedWorkOrderInput,
  StartWorkOrderParticipationInput,
  UpdateWorkOrderDetailsInput,
  UpdateWorkOrderTaskInput,
  ValidateWorkOrderInput,
  WorkOrderListItem,
  WorkOrderReport,
} from "../../../../types/workOrder";

export type WorkOrderDetailsDrawerProps = {
  workOrder: WorkOrderListItem | null;
  report: WorkOrderReport | null;
  loading: boolean;
  members: WorkspaceOperationalMember[];
  loadingMembers: boolean;
  savingDetails: boolean;
  savingPlanning: boolean;
  savingTaskStructure: boolean;
  applyingStandardTasks: boolean;
  completingTaskId: string | null;
  markingTaskNotApplicableId: string | null;
  updatingTaskId: string | null;
  deletingTaskId: string | null;
  releasing: boolean;
  startingExecution: boolean;
  finishingParticipation: boolean;
  finishingOrder: boolean;
  validating: boolean;
  onClose: () => void;
  onUpdateDetails: (input: UpdateWorkOrderDetailsInput) => Promise<void>;
  onUpdatePlanning: (input: PlanWorkOrderInput) => Promise<void>;
  onAddTask: (input: AddWorkOrderTaskInput) => Promise<void>;
  onUpdateTask: (input: UpdateWorkOrderTaskInput) => Promise<void>;
  onDeleteTask: (input: DeleteWorkOrderTaskInput) => Promise<void>;
  onApplyStandardTasks: (workOrderId: string) => Promise<void>;
  onCompleteTask: (input: CompleteWorkOrderTaskInput) => Promise<void>;
  onMarkTaskNotApplicable: (input: MarkWorkOrderTaskNotApplicableInput) => Promise<void>;
  onRelease: (input: ReleaseWorkOrderInput) => Promise<void>;
  onReopenRejected: (input: ReopenRejectedWorkOrderInput) => Promise<void>;
  onStartExecution: (input: StartWorkOrderParticipationInput) => Promise<void>;
  onFinishParticipation: (input: FinishWorkOrderParticipationInput) => Promise<void>;
  onFinishWorkOrder: (input: FinishWorkOrderInput) => Promise<void>;
  onValidate: (input: ValidateWorkOrderInput) => Promise<void>;
};

export type TaskCompletionDraft = {
  answerText: string;
  answerNumber: string;
  answerBoolean: string;
  complianceStatus: string;
  notApplicableReason: string;
};
