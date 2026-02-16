import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";
import { useQuery } from "@evolu/react";
import { allTodos, allProjects, allAreas } from "@/db/queries";
import type { ProjectRow } from "@/db/queries";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Box, Trash2, GripVertical } from "lucide-react";
import { useActiveView } from "@/hooks/useActiveView";
import { useAreaActions } from "@/hooks/useAreaActions";
import { useProjectActions } from "@/hooks/useProjectActions";
import { ProgressCircle } from "@/components/shared/ProgressCircle";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "@/hooks/useTranslation";

export function AreaView({ areaId }: { areaId: string }) {
  const t = useTranslation();
  const { setActiveView } = useActiveView();
  const { deleteArea, updateArea } = useAreaActions();
  const { updateProject } = useProjectActions();
  const todos = useQuery(allTodos);
  const projects = useQuery(allProjects);
  const areas = useQuery(allAreas);

  const area = areas.find((a) => a.id === areaId);

  const [confirmDeleteArea, setConfirmDeleteArea] = useState(false);
  const [areaNotes, setAreaNotes] = useState(area?.notes ?? "");
  useEffect(() => {
    setAreaNotes(area?.notes ?? "");
  }, [area?.notes]);

  function handleAreaNotesBlur() {
    const newNotes = areaNotes.trim() || null;
    if (newNotes !== (area?.notes ?? null)) {
      updateArea(areaId, { notes: newNotes });
    }
  }

  const areaProjects = useMemo(
    () =>
      [...projects]
        .filter((p) => p.areaId === areaId)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [projects, areaId],
  );

  const openCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of todos) {
      if (t.projectId && t.isCompleted !== 1) {
        map.set(t.projectId, (map.get(t.projectId) ?? 0) + 1);
      }
    }
    return map;
  }, [todos]);

  const progressMap = useMemo(() => {
    const totals = new Map<string, { total: number; done: number }>();
    for (const t of todos) {
      if (!t.projectId) continue;
      const entry = totals.get(t.projectId) ?? { total: 0, done: 0 };
      entry.total++;
      if (t.isCompleted === 1) entry.done++;
      totals.set(t.projectId, entry);
    }
    const map = new Map<string, number>();
    for (const [pid, { total, done }] of totals) {
      map.set(pid, total > 0 ? done / total : 0);
    }
    return map;
  }, [todos]);

  const projectIds = useMemo(
    () => areaProjects.map((p) => p.id),
    [areaProjects],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = areaProjects.findIndex((p) => p.id === active.id);
    const newIndex = areaProjects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(areaProjects, oldIndex, newIndex);
    for (let i = 0; i < reordered.length; i++) {
      const project = reordered[i];
      if (project.position !== i) {
        updateProject(project.id, { position: i });
      }
    }
  }

  return (
    <div>
      <ViewHeader
        title={area?.name ?? "Area"}
        icon={<Box className="h-6 w-6" style={{ color: "#06b6d4" }} />}
        onTitleChange={(name) => updateArea(areaId, { name })}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirmDeleteArea(true)}
          title={t("view.deleteArea")}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </ViewHeader>

      <div className="px-4 pb-2">
        <Textarea
          value={areaNotes}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAreaNotes(e.target.value)}
          onBlur={handleAreaNotesBlur}
          placeholder={t("todo.notesPlaceholder")}
          className="min-h-[2rem] resize-none border-none p-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>

      {areaProjects.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("view.areaEmpty")}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={projectIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {areaProjects.map((project) => (
                <SortableProjectRow
                  key={project.id}
                  project={project}
                  openCount={openCountMap.get(project.id) ?? 0}
                  progress={progressMap.get(project.id) ?? 0}
                  onClick={() =>
                    setActiveView({ kind: "project", projectId: project.id })
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDeleteDialog
        open={confirmDeleteArea}
        onOpenChange={setConfirmDeleteArea}
        title={t("confirm.deleteArea")}
        description={t("confirm.deleteAreaDesc")}
        onConfirm={() => {
          deleteArea(areaId);
          setActiveView({ kind: "inbox" });
        }}
      />
    </div>
  );
}

function SortableProjectRow({
  project,
  openCount,
  progress,
  onClick,
}: {
  project: ProjectRow;
  openCount: number;
  progress: number;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <button
        className="group relative flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-accent"
        onClick={onClick}
      >
        <div
          ref={setActivatorNodeRef}
          {...listeners}
          className="absolute -left-5 top-3 cursor-grab opacity-0 group-hover:opacity-50 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <ProgressCircle
          progress={progress}
          color={project.color ?? undefined}
          className="h-5 w-5"
        />
        <span className="flex-1 truncate font-medium">{project.name}</span>
        {openCount > 0 && (
          <span className="mr-2.5 text-sm text-muted-foreground">{openCount}</span>
        )}
      </button>
    </div>
  );
}
