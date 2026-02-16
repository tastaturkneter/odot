import { useMemo } from "react";
import { useQuery } from "@evolu/react";
import { allTodos, archivedProjects } from "@/db/queries";

/**
 * Returns all non-deleted todos, excluding those belonging to archived projects.
 * Use `useQuery(allTodos)` directly when you need archived project todos too
 * (e.g. ProjectView, ArchiveView).
 */
export function useActiveTodos() {
  const todos = useQuery(allTodos);
  const archived = useQuery(archivedProjects);
  return useMemo(() => {
    if (archived.length === 0) return todos;
    const archivedIds = new Set(archived.map((p) => p.id));
    return todos.filter(
      (t) => !t.projectId || !archivedIds.has(t.projectId),
    );
  }, [todos, archived]);
}
