export type Role = "STUDENT" | "SUPERVISOR" | "HOD";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  department?: string;
  title?: string;
  program?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  registrationNumber?: string;
}

export type ProjectStatus =
  | "PROPOSAL"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "REVISION"
  | "COMPLETED"
  | "ON_HOLD";

export interface Project {
  id: number;
  title: string;
  description?: string;
  currentPhase?: string;
  status: ProjectStatus;
  progress: number;
  startDate?: string;
  dueDate?: string;
  daysRemaining?: number;
  student?: User;
  supervisor?: User;
}

export type TaskStatus = "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: number;
  title: string;
  description?: string;
  category?: string;
  status: TaskStatus;
  priority?: Priority;
  progress: number;
  dueDate?: string;
  milestone: boolean;
  projectId?: number;
}

export type SubmissionStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "NEEDS_REVISION";

export interface Submission {
  id: number;
  title: string;
  notes?: string;
  fileUrl?: string;
  fileName?: string;
  status: SubmissionStatus;
  submittedAt?: string;
  projectId?: number;
  taskId?: number;
  student?: User;
}

export interface PendingReview extends Submission {
  hoursWaiting: number;
  reviewDeadlineHours: number;
  hoursUntilDeadline: number;
  isOverdue: boolean;
  submittedHour?: number;
  priorityLabel?: string;
}

export interface Feedback {
  id: number;
  title?: string;
  content: string;
  createdAt?: string;
  projectId?: number;
  author?: User;
}

export type NotificationType =
  | "DEADLINE"
  | "FEEDBACK"
  | "ASSIGNMENT"
  | "SYSTEM"
  | "APPROVAL";

export interface AppNotification {
  id: number;
  title: string;
  message?: string;
  type: NotificationType;
  severity?: Priority;
  read: boolean;
  actionPath?: string;
  createdAt?: string;
}

export interface StudentDashboard {
  student: User;
  project: Project;
  supervisor?: User;
  upcomingTasks: Task[];
  recentFeedback: Feedback[];
  recentSubmissions: Submission[];
  unreadNotifications: number;
  nextMilestone?: Task;
}

export interface TaskBoard {
  project: Project;
  overallProgress: number;
  nextMilestone?: Task;
  daysToMilestone?: number;
  tasks: Task[];
  statusCounts: Record<string, number>;
}

export interface PipelineRow {
  projectId: number;
  studentName: string;
  projectTitle: string;
  currentPhase?: string;
  status: string;
  progress: number;
}

export interface SupervisorDashboard {
  supervisor: User;
  totalStudents: number;
  pendingReviews: number;
  activeProjects: number;
  completedProjects: number;
  pendingThesisReviews: PendingReview[];
  criticalAlerts: AppNotification[];
  researchPipeline: PipelineRow[];
}

export interface SupervisorWorkload {
  supervisorId: number;
  name: string;
  title?: string;
  load: number;
  capacity: number;
  status: string;
}

export interface HodStudentRow {
  id: number;
  fullName: string;
  email: string;
  registrationNumber?: string;
  program?: string;
  department?: string;
  phone?: string;
  isAssigned: boolean;
  projectTitle?: string;
  projectStatus?: ProjectStatus;
  supervisor?: User;
}

export interface HodDashboard {
  facultyPerformance: number;
  totalStudents: number;
  totalSupervisors: number;
  activeProjects: number;
  unassignedCount: number;
  pendingProposals: number;
  pendingSupervisorRequests: number;
  supervisorWorkload: SupervisorWorkload[];
  unassignedStudents: User[];
  projectStatusBreakdown: Record<string, number>;
}

export interface SupervisorStudent {
  project: Project;
  pendingSubmissions: number;
  totalSubmissions: number;
  lastSubmissionTitle?: string;
  lastSubmissionAt?: string;
  completedMilestones: number;
  totalMilestones: number;
  submissions?: Submission[];
}

export interface SupervisorFacultyStat {
  supervisorId: number;
  name: string;
  title?: string;
  studentCount: number;
  avgProgress: number;
  completedProjects: number;
  atRiskCount: number;
}

export interface HodFacultyOverview {
  facultyPerformance: number;
  onTrackCount: number;
  atRiskCount: number;
  completedCount: number;
  totalProjects: number;
  supervisorStats: SupervisorFacultyStat[];
  progressByProgram: Record<string, number>;
}

export type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PublicSupervisor {
  id: number;
  fullName: string;
  title?: string;
  department?: string;
  load?: number;
  capacity?: number;
  spotsAvailable?: number;
}

export interface DeptPrograms {
  code: string;
  label: string;
  programs: string[];
}

export interface TopicOption {
  topicIndex: number;
  topic: string;
  abstract: string;
  similarityScore: number;
  similarityLevel: "low" | "medium" | "high";
}

export interface TopicProposal {
  id: number;
  fullName: string;
  email: string;
  registrationNumber: string;
  phone?: string;
  program: string;
  department: string;
  topics: TopicOption[];
  supervisorChoice1?: User;
  supervisorChoice2?: User;
  status: ProposalStatus;
  selectedTopicIndex?: number;
  rejectionReason?: string;
  assignedSupervisor?: User;
  studentUserId?: number;
  createdAt?: string;
}

export interface ProposalStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface ActiveProjectRef {
  id: number;
  title: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  studentName?: string;
  supervisorName?: string;
  program?: string;
}

export interface HodProposalPipeline {
  stats: ProposalStats;
  proposals: TopicProposal[];
  activeProjects: ActiveProjectRef[];
  department: string;
}

export interface HodStudentRequest {
  id: number;
  message: string;
  status: RequestStatus;
  hodResponse?: string;
  createdAt?: string;
  supervisor?: User;
}
