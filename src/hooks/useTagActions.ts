import { useEvolu } from "@/db/evolu";

export function useTagActions() {
  const evolu = useEvolu();

  function createTag(name: string, position: number) {
    return evolu.insert("tag", { name, position });
  }

  function updateTag(
    id: string,
    fields: {
      name?: string;
      color?: string | null;
      position?: number;
    },
  ) {
    return evolu.update("tag", { id, ...fields } as never);
  }

  function deleteTag(id: string) {
    return evolu.update("tag", { id, isDeleted: 1 } as never);
  }

  function addTagToTodo(todoId: string, tagId: string) {
    return evolu.insert("todoTag", { todoId, tagId } as never);
  }

  function removeTagFromTodo(todoTagId: string) {
    return evolu.update("todoTag", {
      id: todoTagId,
      isDeleted: 1,
    } as never);
  }

  return { createTag, updateTag, deleteTag, addTagToTodo, removeTagFromTodo };
}
