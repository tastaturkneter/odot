import { useEvolu } from "@/db/evolu";

export function useAreaActions() {
  const evolu = useEvolu();

  function createArea(name: string, position: number) {
    return evolu.insert("area", { name, position });
  }

  function updateArea(
    id: string,
    fields: { name?: string; notes?: string | null; position?: number },
  ) {
    return evolu.update("area", { id, ...fields } as never);
  }

  function deleteArea(id: string) {
    return evolu.update("area", { id, isDeleted: 1 } as never);
  }

  return { createArea, updateArea, deleteArea };
}
