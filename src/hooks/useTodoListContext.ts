import { createContext, useContext } from "react";

export interface TodoListActions {
  moveUp: () => void;
  moveDown: () => void;
  expandSelected: () => void;
  collapseSelected: () => void;
  toggleCompleteSelected: () => void;
  deleteSelected: () => void;
  deselect: () => void;
  getSelectedTodoId: () => string | null;
  getSelectedTodoIds: () => string[];
  openPickerOnSelected: (picker: "when" | "deadline" | "project" | "tag") => void;
  setSomeday: () => void;
}

export const TodoListContext = createContext<TodoListActions | null>(null);

export function useTodoListContext(): TodoListActions | null {
  return useContext(TodoListContext);
}
