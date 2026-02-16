export type TemporalView = "inbox" | "today" | "anytime" | "upcoming" | "someday" | "logbook" | "archive" | "trash";

export type ProjectView = {
  kind: "project";
  projectId: string;
};

export type TagView = {
  kind: "tag";
  tagId: string;
};

export type AreaView = {
  kind: "area";
  areaId: string;
};

export type ActiveView =
  | { kind: TemporalView }
  | ProjectView
  | TagView
  | AreaView;

export const temporalViews = [
  "inbox",
  "today",
  "anytime",
  "upcoming",
  "someday",
  "logbook",
  "archive",
  "trash",
] as const;

export function viewToPath(view: ActiveView): string {
  switch (view.kind) {
    case "project":
      return `/project/${view.projectId}`;
    case "tag":
      return `/tag/${view.tagId}`;
    case "area":
      return `/area/${view.areaId}`;
    default:
      return `/${view.kind}`;
  }
}

export function pathToView(path: string): ActiveView {
  const segments = path.split("/").filter(Boolean);
  const root = segments[0];
  const id = segments[1];

  if (root === "project" && id) return { kind: "project", projectId: id };
  if (root === "tag" && id) return { kind: "tag", tagId: id };
  if (root === "area" && id) return { kind: "area", areaId: id };
  if (
    root === "inbox" ||
    root === "today" ||
    root === "anytime" ||
    root === "upcoming" ||
    root === "someday" ||
    root === "logbook" ||
    root === "archive" ||
    root === "trash"
  )
    return { kind: root };

  return { kind: "inbox" };
}

export function viewLabel(view: ActiveView): string {
  switch (view.kind) {
    case "inbox":
      return "Inbox";
    case "today":
      return "Today";
    case "anytime":
      return "Anytime";
    case "upcoming":
      return "Upcoming";
    case "someday":
      return "Someday";
    case "logbook":
      return "Logbook";
    case "archive":
      return "Archive";
    case "trash":
      return "Trash";
    case "project":
    case "tag":
    case "area":
      return ""; // resolved by the component using project/tag/area name
  }
}
