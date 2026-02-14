import {
  id,
  NonEmptyString1000,
  String1000,
  SqliteBoolean,
  nullOr,
  Number,
} from "@evolu/common";

// ID types (Evolu requires Capitalize<string> for table names)
const TodoId = id("Todo");
type TodoId = typeof TodoId.Type;

const ProjectId = id("Project");
type ProjectId = typeof ProjectId.Type;

const TagId = id("Tag");
type TagId = typeof TagId.Type;

const TodoTagId = id("TodoTag");
type TodoTagId = typeof TodoTagId.Type;

const ChecklistItemId = id("ChecklistItem");
type ChecklistItemId = typeof ChecklistItemId.Type;

const AreaId = id("Area");
type AreaId = typeof AreaId.Type;

const ProjectHeadingId = id("ProjectHeading");
type ProjectHeadingId = typeof ProjectHeadingId.Type;

const SettingId = id("Setting");
type SettingId = typeof SettingId.Type;

// Database schema
const Schema = {
  todo: {
    id: TodoId,
    title: NonEmptyString1000,
    notes: nullOr(String1000),
    whenDate: nullOr(String1000), // ISO date "YYYY-MM-DD"
    whenSomeday: nullOr(SqliteBoolean), // 1 = someday
    deadline: nullOr(String1000), // ISO date "YYYY-MM-DD"
    projectId: nullOr(ProjectId),
    position: Number,
    isCompleted: SqliteBoolean,
    completedAt: nullOr(String1000), // ISO timestamp
    recurrenceRule: nullOr(String1000), // RRULE string
  },
  project: {
    id: ProjectId,
    name: NonEmptyString1000,
    notes: nullOr(String1000),
    color: nullOr(String1000), // hex color
    position: Number,
    areaId: nullOr(AreaId),
  },
  area: {
    id: AreaId,
    name: NonEmptyString1000,
    notes: nullOr(String1000),
    position: Number,
  },
  tag: {
    id: TagId,
    name: NonEmptyString1000,
    color: nullOr(String1000), // hex color
    position: Number,
  },
  todoTag: {
    id: TodoTagId,
    todoId: TodoId,
    tagId: TagId,
  },
  checklistItem: {
    id: ChecklistItemId,
    todoId: TodoId,
    text: NonEmptyString1000,
    isCompleted: SqliteBoolean,
    position: Number,
  },
  projectHeading: {
    id: ProjectHeadingId,
    projectId: ProjectId,
    title: NonEmptyString1000,
    position: Number,
  },
  setting: {
    id: SettingId,
    key: NonEmptyString1000,
    value: String1000,
  },
} as const;

export {
  Schema,
  TodoId,
  ProjectId,
  AreaId,
  TagId,
  TodoTagId,
  ChecklistItemId,
  ProjectHeadingId,
  SettingId,
};
export type { TodoId as TodoIdType };
