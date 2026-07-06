import type { AppNotification, NotificationType, Role } from "@/types";

const DEFAULT_PATHS: Record<Role, Record<NotificationType, string>> = {
  STUDENT: {
    DEADLINE: "/student/progress",
    FEEDBACK: "/student/feedback",
    ASSIGNMENT: "/student",
    SYSTEM: "/student",
    APPROVAL: "/student/submissions",
  },
  SUPERVISOR: {
    DEADLINE: "/supervisor/reviews",
    FEEDBACK: "/supervisor/reviews",
    ASSIGNMENT: "/supervisor/reviews",
    SYSTEM: "/supervisor/students",
    APPROVAL: "/supervisor/reviews",
  },
  HOD: {
    DEADLINE: "/hod",
    FEEDBACK: "/hod",
    ASSIGNMENT: "/hod/students",
    SYSTEM: "/hod/students",
    APPROVAL: "/hod",
  },
};

export function notificationTargetPath(
  notification: AppNotification,
  role: Role
): string {
  if (notification.actionPath) {
    return notification.actionPath;
  }

  const title = notification.title.toLowerCase();
  const message = (notification.message || "").toLowerCase();

  if (role === "STUDENT") {
    if (title.includes("feedback")) return "/student/feedback";
    if (title.includes("deadline") || title.includes("submission")) return "/student/progress";
    if (title.includes("supervisor")) return "/student";
    if (title.includes("assigned")) return "/student";
  }

  if (role === "SUPERVISOR") {
    if (title.includes("submission") || message.includes("submitted")) return "/supervisor/reviews";
    if (title.includes("review")) return "/supervisor/reviews";
    if (title.includes("student")) return "/supervisor/students";
  }

  if (role === "HOD") {
    if (title.includes("unassigned") || message.includes("supervisor allocation")) {
      return "/hod/students";
    }
    if (title.includes("supervisor")) return "/hod/supervisors";
  }

  return DEFAULT_PATHS[role][notification.type] || "/alerts";
}
