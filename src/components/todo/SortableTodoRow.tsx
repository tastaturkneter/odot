import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TodoRow } from "./TodoRow";
import type { TodoRow as TodoRowType } from "@/db/queries";
import type { PickerType } from "./TodoRow";

interface SortableTodoRowProps {
  todo: TodoRowType;
  isSelected?: boolean;
  onToggleComplete: (id: string, isCompleted: 0 | 1 | null) => void;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  onDelete?: (id: string) => void;
  openPicker?: PickerType | null;
  onPickerOpened?: () => void;
  onNativeDragStart?: (e: React.DragEvent) => void;
}

export function SortableTodoRow({
  todo,
  ...rest
}: SortableTodoRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TodoRow
        todo={todo}
        dragHandleRef={setActivatorNodeRef}
        dragListeners={listeners}
        {...rest}
      />
    </div>
  );
}
