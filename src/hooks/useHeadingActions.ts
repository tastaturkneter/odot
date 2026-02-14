import { useEvolu } from "@/db/evolu";

export function useHeadingActions() {
  const evolu = useEvolu();

  function createHeading(projectId: string, title: string, position: number) {
    return evolu.insert("projectHeading", {
      projectId,
      title,
      position,
    } as never);
  }

  function updateHeading(
    id: string,
    fields: { title?: string; position?: number },
  ) {
    return evolu.update("projectHeading", { id, ...fields } as never);
  }

  function deleteHeading(id: string) {
    return evolu.update("projectHeading", { id, isDeleted: 1 } as never);
  }

  return { createHeading, updateHeading, deleteHeading };
}
