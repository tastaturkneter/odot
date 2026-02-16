import { useEvolu } from "@/db/evolu";

export function useProjectActions() {
  const evolu = useEvolu();

  function createProject(name: string, position: number, areaId?: string) {
    return evolu.insert("project", {
      name,
      position,
      ...(areaId ? { areaId } : {}),
    });
  }

  function updateProject(
    id: string,
    fields: {
      name?: string;
      notes?: string | null;
      color?: string | null;
      position?: number;
      areaId?: string | null;
    },
  ) {
    return evolu.update("project", { id, ...fields } as never);
  }

  function deleteProject(id: string) {
    return evolu.update("project", { id, isDeleted: 1 } as never);
  }

  function archiveProject(id: string) {
    return evolu.update("project", { id, isArchived: 1 } as never);
  }

  function unarchiveProject(id: string) {
    return evolu.update("project", { id, isArchived: null } as never);
  }

  return { createProject, updateProject, deleteProject, archiveProject, unarchiveProject };
}
