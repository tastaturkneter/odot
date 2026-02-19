import { evolu } from "@/db/evolu";
import {
  allTodos,
  allProjects,
  allAreas,
  allTags,
  allTodoTags,
  allChecklistItems,
  allProjectHeadings,
  allSettings,
} from "@/db/queries";

interface ExportData {
  version: 1;
  exportedAt: string;
  data: {
    areas: Record<string, unknown>[];
    tags: Record<string, unknown>[];
    projects: Record<string, unknown>[];
    projectHeadings: Record<string, unknown>[];
    todos: Record<string, unknown>[];
    todoTags: Record<string, unknown>[];
    checklistItems: Record<string, unknown>[];
    settings: Record<string, unknown>[];
  };
}

export async function exportData(): Promise<void> {
  const [areas, tags, projects, projectHeadings, todos, todoTags, checklistItems, settings] =
    await Promise.all([
      evolu.loadQuery(allAreas),
      evolu.loadQuery(allTags),
      evolu.loadQuery(allProjects),
      evolu.loadQuery(allProjectHeadings),
      evolu.loadQuery(allTodos),
      evolu.loadQuery(allTodoTags),
      evolu.loadQuery(allChecklistItems),
      evolu.loadQuery(allSettings),
    ]);

  const exportObj: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      areas: [...areas],
      tags: [...tags],
      projects: [...projects],
      projectHeadings: [...projectHeadings],
      todos: [...todos],
      todoTags: [...todoTags],
      checklistItems: [...checklistItems],
      settings: [...settings],
    },
  };

  const json = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = `odot-export-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importData(json: string): Promise<number> {
  const parsed = JSON.parse(json) as ExportData;
  if (parsed.version !== 1 || !parsed.data) {
    throw new Error("Invalid export file format");
  }

  const { data } = parsed;
  let count = 0;

  // ID remapping tables
  const areaIdMap = new Map<string, string>();
  const tagIdMap = new Map<string, string>();
  const projectIdMap = new Map<string, string>();
  const projectHeadingIdMap = new Map<string, string>();
  const todoIdMap = new Map<string, string>();

  // 1. Areas
  for (const area of data.areas ?? []) {
    const result = evolu.insert("area", {
      name: area.name,
      notes: area.notes ?? null,
      position: area.position ?? 0,
    } as never);
    if (result.ok) {
      areaIdMap.set(area.id as string, result.value.id);
      count++;
    }
  }

  // 2. Tags
  for (const tag of data.tags ?? []) {
    const result = evolu.insert("tag", {
      name: tag.name,
      color: tag.color ?? null,
      position: tag.position ?? 0,
    } as never);
    if (result.ok) {
      tagIdMap.set(tag.id as string, result.value.id);
      count++;
    }
  }

  // 3. Projects (remap areaId)
  for (const project of data.projects ?? []) {
    const areaId = project.areaId ? areaIdMap.get(project.areaId as string) ?? null : null;
    const result = evolu.insert("project", {
      name: project.name,
      notes: project.notes ?? null,
      color: project.color ?? null,
      position: project.position ?? 0,
      ...(areaId ? { areaId } : {}),
    } as never);
    if (result.ok) {
      projectIdMap.set(project.id as string, result.value.id);
      count++;
    }
  }

  // 4. Project headings (remap projectId)
  for (const heading of data.projectHeadings ?? []) {
    const projectId = heading.projectId ? projectIdMap.get(heading.projectId as string) ?? null : null;
    if (!projectId) continue;
    const result = evolu.insert("projectHeading", {
      projectId,
      title: heading.title,
      position: heading.position ?? 0,
    } as never);
    if (result.ok) {
      projectHeadingIdMap.set(heading.id as string, result.value.id);
      count++;
    }
  }

  // 5. Todos (remap projectId)
  for (const todo of data.todos ?? []) {
    const projectId = todo.projectId ? projectIdMap.get(todo.projectId as string) ?? null : null;
    const result = evolu.insert("todo", {
      title: todo.title,
      notes: todo.notes ?? null,
      whenDate: todo.whenDate ?? null,
      whenSomeday: todo.whenSomeday ?? null,
      whenEvening: todo.whenEvening ?? null,
      deadline: todo.deadline ?? null,
      position: todo.position ?? 0,
      isCompleted: todo.isCompleted ?? 0,
      completedAt: todo.completedAt ?? null,
      recurrenceRule: todo.recurrenceRule ?? null,
      ...(projectId ? { projectId } : {}),
    } as never);
    if (result.ok) {
      todoIdMap.set(todo.id as string, result.value.id);
      count++;
    }
  }

  // 6. TodoTags (remap todoId, tagId)
  for (const todoTag of data.todoTags ?? []) {
    const todoId = todoIdMap.get(todoTag.todoId as string);
    const tagId = tagIdMap.get(todoTag.tagId as string);
    if (!todoId || !tagId) continue;
    const result = evolu.insert("todoTag", { todoId, tagId } as never);
    if (result.ok) count++;
  }

  // 7. Checklist items (remap todoId)
  for (const item of data.checklistItems ?? []) {
    const todoId = todoIdMap.get(item.todoId as string);
    if (!todoId) continue;
    const result = evolu.insert("checklistItem", {
      todoId,
      text: item.text,
      isCompleted: item.isCompleted ?? 0,
      position: item.position ?? 0,
    } as never);
    if (result.ok) count++;
  }

  // 8. Settings (insert with key/value)
  for (const setting of data.settings ?? []) {
    const result = evolu.insert("setting", {
      key: setting.key,
      value: setting.value,
    } as never);
    if (result.ok) count++;
  }

  return count;
}
