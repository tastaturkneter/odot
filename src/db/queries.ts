import type { InferRow } from "@evolu/common";
import { evolu } from "./evolu";

// All non-deleted todos with basic fields
const allTodos = evolu.createQuery((db) =>
  db
    .selectFrom("todo")
    .select([
      "id",
      "title",
      "notes",
      "whenDate",
      "whenSomeday",
      "deadline",
      "projectId",
      "position",
      "isCompleted",
      "completedAt",
      "recurrenceRule",
      "createdAt",
      "updatedAt",
    ])
    .where("isDeleted", "is not", 1)
    .orderBy("position", "asc"),
);

// All non-deleted projects
const allProjects = evolu.createQuery((db) =>
  db
    .selectFrom("project")
    .select(["id", "name", "notes", "color", "position", "areaId"])
    .where("isDeleted", "is not", 1)
    .where("isArchived", "is not", 1)
    .orderBy("position", "asc"),
);

// All archived projects
const archivedProjects = evolu.createQuery((db) =>
  db
    .selectFrom("project")
    .select(["id", "name", "notes", "color", "position", "areaId"])
    .where("isDeleted", "is not", 1)
    .where("isArchived", "is", 1)
    .orderBy("updatedAt", "desc"),
);

// All non-deleted areas
const allAreas = evolu.createQuery((db) =>
  db
    .selectFrom("area")
    .select(["id", "name", "notes", "position"])
    .where("isDeleted", "is not", 1)
    .orderBy("position", "asc"),
);

// All non-deleted tags
const allTags = evolu.createQuery((db) =>
  db
    .selectFrom("tag")
    .select(["id", "name", "color", "position"])
    .where("isDeleted", "is not", 1)
    .orderBy("position", "asc"),
);

// All non-deleted todoTag associations
const allTodoTags = evolu.createQuery((db) =>
  db
    .selectFrom("todoTag")
    .select(["id", "todoId", "tagId"])
    .where("isDeleted", "is not", 1),
);

// All non-deleted checklist items
const allChecklistItems = evolu.createQuery((db) =>
  db
    .selectFrom("checklistItem")
    .select(["id", "todoId", "text", "isCompleted", "position"])
    .where("isDeleted", "is not", 1)
    .orderBy("position", "asc"),
);

// All deleted todos (trash)
const deletedTodos = evolu.createQuery((db) =>
  db
    .selectFrom("todo")
    .select([
      "id",
      "title",
      "notes",
      "whenDate",
      "whenSomeday",
      "deadline",
      "projectId",
      "position",
      "isCompleted",
      "completedAt",
      "recurrenceRule",
      "createdAt",
      "updatedAt",
    ])
    .where("isDeleted", "is", 1)
    .orderBy("updatedAt", "desc"),
);

// All non-deleted project headings
const allProjectHeadings = evolu.createQuery((db) =>
  db
    .selectFrom("projectHeading")
    .select(["id", "projectId", "title", "position"])
    .where("isDeleted", "is not", 1)
    .orderBy("position", "asc"),
);

// All settings
const allSettings = evolu.createQuery((db) =>
  db
    .selectFrom("setting")
    .select(["id", "key", "value"])
    .where("isDeleted", "is not", 1),
);

export type TodoRow = InferRow<typeof allTodos>;
export type ProjectRow = InferRow<typeof allProjects>;
export type ArchivedProjectRow = InferRow<typeof archivedProjects>;
export type TagRow = InferRow<typeof allTags>;
export type TodoTagRow = InferRow<typeof allTodoTags>;
export type AreaRow = InferRow<typeof allAreas>;
export type ChecklistItemRow = InferRow<typeof allChecklistItems>;
export type ProjectHeadingRow = InferRow<typeof allProjectHeadings>;
export type DeletedTodoRow = InferRow<typeof deletedTodos>;

export {
  allTodos,
  allProjects,
  archivedProjects,
  allAreas,
  allTags,
  allTodoTags,
  allChecklistItems,
  allProjectHeadings,
  allSettings,
  deletedTodos,
};
