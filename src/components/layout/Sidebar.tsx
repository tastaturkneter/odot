import { useState, useEffect, type ReactNode } from "react";
import {
  Inbox,
  Sun,
  Calendar,
  Clock,
  BookOpen,
  FolderOpen,
  Tag,
  Plus,
  User,
  ChevronRight,
  ChevronDown,
  Box,
  Trash2,
  Repeat,
  Settings,
  Archive,
} from "lucide-react";
import { useQuery, useEvoluError } from "@evolu/react";
import { allProjects, allAreas, allTags, allTodoTags } from "@/db/queries";
import { useActiveTodos } from "@/hooks/useActiveTodos";
import { useActiveView } from "@/hooks/useActiveView";
import { useProjectActions } from "@/hooks/useProjectActions";
import { useAreaActions } from "@/hooks/useAreaActions";
import { useTagActions } from "@/hooks/useTagActions";
import { useTodoActions } from "@/hooks/useTodoActions";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getSyncIndicator } from "@/components/shared/SyncStatus";
import { SidebarItem } from "./SidebarItem";
import { SidebarInlineInput } from "./SidebarInlineInput";
import { useTranslation } from "@/hooks/useTranslation";
import { AccountDialog } from "@/components/shared/AccountDialog";
import { SettingsDialog } from "@/components/shared/SettingsDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ActiveView } from "@/lib/views";
import { todayStr } from "@/lib/dates";

function SortableAreaHeader({ id, children, dropIndicator, dropIndented }: { id: string; children: ReactNode; dropIndicator?: "above" | "below" | null; dropIndented?: boolean }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const indentLeft = dropIndented ? "left-5" : "left-1";
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: isDragging ? CSS.Transform.toString(transform) : undefined,
        transition: isDragging ? transition : undefined,
        opacity: isDragging ? 0.5 : undefined,
      }}
      className={`relative rounded-md ${isDragging ? "z-10" : ""}`}
    >
      {dropIndicator === "above" && (
        <div className={`absolute -top-px ${indentLeft} right-1 h-0.5 rounded-full bg-primary`} />
      )}
      <div ref={setActivatorNodeRef} {...attributes} {...listeners}>
        {children}
      </div>
      {dropIndicator === "below" && (
        <div className={`absolute -bottom-px ${indentLeft} right-1 h-0.5 rounded-full bg-primary`} />
      )}
    </div>
  );
}

function SortableGap({ id, dropIndicator, dropIndented }: { id: string; dropIndicator?: "above" | "below" | null; dropIndented?: boolean }) {
  const { setNodeRef } = useSortable({ id, disabled: { draggable: true } });
  const indentLeft = dropIndented ? "left-5" : "left-1";
  return (
    <div
      ref={setNodeRef}
      className="relative h-px"
    >
      {dropIndicator === "above" && (
        <div className={`absolute -top-px ${indentLeft} right-1 h-0.5 rounded-full bg-primary`} />
      )}
      {dropIndicator === "below" && (
        <div className={`absolute -bottom-px ${indentLeft} right-1 h-0.5 rounded-full bg-primary`} />
      )}
    </div>
  );
}

function SortableProjectItem({ id, children, dropIndicator, dropIndented }: { id: string; children: ReactNode; dropIndicator?: "above" | "below" | null; dropIndented?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const indentLeft = dropIndented ? "left-5" : "left-1";
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: isDragging ? CSS.Transform.toString(transform) : undefined,
        transition: isDragging ? transition : undefined,
        opacity: isDragging ? 0.5 : undefined,
      }}
      className={`relative ${isDragging ? "z-10" : ""}`}
      {...attributes}
      {...listeners}
    >
      {dropIndicator === "above" && (
        <div className={`absolute -top-px ${indentLeft} right-1 h-0.5 rounded-full bg-primary`} />
      )}
      {children}
      {dropIndicator === "below" && (
        <div className={`absolute -bottom-px ${indentLeft} right-1 h-0.5 rounded-full bg-primary`} />
      )}
    </div>
  );
}

export function Sidebar() {
  const { activeView, setActiveView: rawSetActiveView, setSidebarOpen } = useActiveView();

  function setActiveView(view: ActiveView) {
    rawSetActiveView(view);
    setSidebarOpen(false);
  }
  const { createProject, updateProject } = useProjectActions();
  const { createArea, updateArea } = useAreaActions();
  const { createTag } = useTagActions();
  const { updateTodo } = useTodoActions();
  const evoluError = useEvoluError();
  const isOnline = useOnlineStatus();
  const syncIndicator = getSyncIndicator(evoluError, isOnline);
  const t = useTranslation();
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const todos = useActiveTodos();
  const projects = useQuery(allProjects);
  const areas = useQuery(allAreas);
  const tags = useQuery(allTags);
  const todoTags = useQuery(allTodoTags);

  const [addingArea, setAddingArea] = useState(false);
  const [addingProjectInArea, setAddingProjectInArea] = useState<string | null>(null);
  const [addingUngroupedProject, setAddingUngroupedProject] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);
  const [dragOverViewId, setDragOverViewId] = useState<string | null>(null);

  // Clear drag-over highlights when native drag ends anywhere
  useEffect(() => {
    function handleDragEnd() {
      setDragOverProjectId(null);
      setDragOverViewId(null);
    }
    document.addEventListener("dragend", handleDragEnd);
    return () => document.removeEventListener("dragend", handleDragEnd);
  }, []);

  const today = todayStr();

  // Count helpers
  const activeTodos = todos.filter((t) => t.isCompleted === 0);

  const todoTagMap = new Map<string, Set<string>>();
  for (const tt of todoTags) {
    if (tt.todoId === null || tt.tagId === null) continue;
    if (!todoTagMap.has(tt.todoId)) todoTagMap.set(tt.todoId, new Set());
    todoTagMap.get(tt.todoId)!.add(tt.tagId);
  }

  function overdue(list: typeof activeTodos): number {
    return list.filter((t) => !!t.deadline && t.deadline < today).length;
  }

  const inboxTodos = activeTodos.filter(
    (t) =>
      t.whenDate === null &&
      (t.whenSomeday === null || t.whenSomeday === 0) &&
      t.projectId === null &&
      !todoTagMap.has(t.id),
  );

  const todayTodos = activeTodos.filter(
    (t) => t.whenDate !== null && t.whenDate <= today,
  );


  function projectProgress(projectId: string): number {
    const all = todos.filter((t) => t.projectId === projectId);
    if (all.length === 0) return 0;
    return all.filter((t) => t.isCompleted === 1).length / all.length;
  }

  function isActive(view: ActiveView): boolean {
    return JSON.stringify(activeView) === JSON.stringify(view);
  }

  function handleViewDrop(viewId: string, todoIds: string[]) {
    for (const id of todoIds) {
      switch (viewId) {
        case "inbox":
          updateTodo(id, { whenDate: null, whenSomeday: null, whenEvening: null, projectId: null });
          break;
        case "today":
          updateTodo(id, { whenDate: today, whenSomeday: null, whenEvening: null });
          break;
        case "upcoming": {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          updateTodo(id, { whenDate: tomorrow.toISOString().split("T")[0], whenSomeday: null, whenEvening: null });
          break;
        }
        case "anytime":
          updateTodo(id, { whenDate: null, whenSomeday: null, whenEvening: null });
          break;
        case "someday":
          updateTodo(id, { whenDate: null, whenSomeday: 1, whenEvening: null });
          break;
      }
    }
  }

  function viewDropHandlers(viewId: string) {
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverViewId(viewId);
      },
      onDragLeave: (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragOverViewId(null);
        }
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverViewId(null);
        const raw = e.dataTransfer.getData("application/x-todo-ids");
        if (!raw) return;
        const ids: string[] = JSON.parse(raw);
        handleViewDrop(viewId, ids);
      },
    };
  }

  function toggleArea(areaId: string) {
    setCollapsedAreas((prev) => {
      const next = new Set(prev);
      if (next.has(areaId)) next.delete(areaId);
      else next.add(areaId);
      return next;
    });
  }

  const ungroupedProjects = projects.filter((p) => p.areaId === null);

  type TopLevelItem =
    | { kind: "area"; id: string; position: number | null }
    | { kind: "project"; id: string; position: number | null };

  const topLevelItems: TopLevelItem[] = [
    ...areas.map((a) => ({ kind: "area" as const, id: a.id, position: a.position })),
    ...ungroupedProjects.map((p) => ({ kind: "project" as const, id: p.id, position: p.position })),
  ].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  // Build flat list of all visible items in visual order
  type FlatItem =
    | { kind: "area"; id: string }
    | { kind: "project"; id: string; parentAreaId: string | null }
    | { kind: "gap"; areaId: string };

  const flatItems: FlatItem[] = [];
  for (const topItem of topLevelItems) {
    if (topItem.kind === "area") {
      flatItems.push({ kind: "area", id: topItem.id });
      // Include children + gap only if expanded AND area is not being dragged
      if (!collapsedAreas.has(topItem.id) && activeDragId !== `area-${topItem.id}`) {
        const children = areaProjects(topItem.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        for (const p of children) {
          flatItems.push({ kind: "project", id: p.id, parentAreaId: topItem.id });
        }
        // Gap sentinel marks the end of this area — dropping below it = ungrouped
        flatItems.push({ kind: "gap", areaId: topItem.id });
      }
    } else {
      flatItems.push({ kind: "project", id: topItem.id, parentAreaId: null });
    }
  }

  const sortableIds = flatItems.map((i) => {
    if (i.kind === "area") return `area-${i.id}`;
    if (i.kind === "project") return `project-${i.id}`;
    return `gap-${i.areaId}`;
  });

  // Compute drop indicator position
  let dropIndicatorId: string | null = null;
  let dropIndicatorPosition: "above" | "below" | null = null;
  let dropIndicatorIndented = false;

  if (activeDragId && overId && activeDragId !== overId) {
    const activeIdx = sortableIds.indexOf(activeDragId);
    const overIdx = sortableIds.indexOf(overId);
    if (activeIdx !== -1 && overIdx !== -1) {
      dropIndicatorId = overId;
      const isProjectDrag = activeDragId.startsWith("project-");
      const wouldBeBelow = activeIdx < overIdx;
      dropIndicatorPosition = wouldBeBelow ? "below" : "above";

      if (isProjectDrag) {
        // Simulate "look above" to determine if project would join an area
        // When "below" item X: after arrayMove, "look above" sees X
        // When "above" item X: after arrayMove, "look above" sees flatItems[overIdx - 1]
        const lookAboveItem = wouldBeBelow
          ? flatItems[overIdx]
          : overIdx > 0 ? flatItems[overIdx - 1] : undefined;

        dropIndicatorIndented = !!(lookAboveItem && (
          lookAboveItem.kind === "area" ||
          (lookAboveItem.kind === "project" && lookAboveItem.parentAreaId !== null)
        ));
      }
    }
  }

  function areaProjects(areaId: string) {
    return projects.filter((p) => p.areaId === areaId);
  }

  function handleCreateArea(name: string) {
    const result = createArea(name, areas.length);
    setAddingArea(false);
    if (result.ok) {
      setActiveView({ kind: "area", areaId: result.value.id });
    }
  }

  function handleCreateProjectInArea(name: string, areaId: string) {
    const result = createProject(name, projects.length, areaId);
    setAddingProjectInArea(null);
    if (result.ok) {
      setActiveView({ kind: "project", projectId: result.value.id });
    }
  }

  function handleCreateUngroupedProject(name: string) {
    const result = createProject(name, projects.length);
    setAddingUngroupedProject(false);
    if (result.ok) {
      setActiveView({ kind: "project", projectId: result.value.id });
    }
  }

  function handleCreateTag(name: string) {
    const result = createTag(name, tags.length);
    setAddingTag(false);
    if (result.ok) {
      setActiveView({ kind: "tag", tagId: result.value.id });
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    setOverId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overIdStr = over.id as string;

    const oldIndex = sortableIds.indexOf(activeId);
    const newIndex = sortableIds.indexOf(overIdStr);
    if (oldIndex === -1 || newIndex === -1) return;

    const isAreaDrag = activeId.startsWith("area-");

    if (isAreaDrag) {
      // Area drag: children are auto-collapsed, so flat list only has top-level items for this area.
      // If dropped on a gap, treat as dropping after the area that owns the gap.
      let effectiveOverId = overIdStr;
      if (overIdStr.startsWith("gap-")) {
        effectiveOverId = `area-${overIdStr.replace("gap-", "")}`;
      }
      const topSortableIds = topLevelItems.map((i) => `${i.kind}-${i.id}`);
      const topOldIndex = topSortableIds.indexOf(activeId);
      const topNewIndex = topSortableIds.indexOf(effectiveOverId);
      if (topOldIndex === -1 || topNewIndex === -1) return;

      const reordered = arrayMove(topLevelItems, topOldIndex, topNewIndex);
      for (let i = 0; i < reordered.length; i++) {
        const item = reordered[i];
        if (item.kind === "area") {
          if (item.position !== i) updateArea(item.id, { position: i });
        } else {
          if (item.position !== i) updateProject(item.id, { position: i });
        }
      }
      return;
    }

    // Project drag: reorder the flat list, then determine area membership via "look above"
    const reordered = arrayMove([...flatItems], oldIndex, newIndex);

    // Walk the reordered list, assign positions and area membership
    let topLevelPos = 0;
    const areaChildCounters: Record<string, number> = {};

    for (let i = 0; i < reordered.length; i++) {
      const item = reordered[i];

      // Gaps don't get positions — they only act as area boundaries in "look above"
      if (item.kind === "gap") continue;

      if (item.kind === "area") {
        const area = areas.find((a) => a.id === item.id);
        if (area && area.position !== topLevelPos) {
          updateArea(item.id, { position: topLevelPos });
        }
        topLevelPos++;
        continue;
      }

      // Determine area membership: look at the item above in the reordered list
      // A gap above means "end of area" → ungrouped
      let newAreaId: string | null = null;
      if (i > 0) {
        const above = reordered[i - 1];
        if (above.kind === "area") {
          newAreaId = above.id;
        } else if (above.kind === "project" && above.parentAreaId !== null) {
          newAreaId = above.parentAreaId;
        }
        // gap or ungrouped project above → stays ungrouped (null)
      }
      // Update parentAreaId on the item in the reordered list for subsequent "look above" checks
      item.parentAreaId = newAreaId;

      const project = projects.find((p) => p.id === item.id);
      if (!project) continue;

      if (newAreaId !== null) {
        // Child project: assign per-area position
        if (!(newAreaId in areaChildCounters)) areaChildCounters[newAreaId] = 0;
        const childPos = areaChildCounters[newAreaId]++;
        const areaChanged = (project.areaId ?? null) !== newAreaId;
        const posChanged = project.position !== childPos;
        if (areaChanged || posChanged) {
          updateProject(item.id, { areaId: newAreaId, position: childPos });
        }
      } else {
        // Ungrouped project: assign top-level position
        const areaChanged = project.areaId !== null;
        const posChanged = project.position !== topLevelPos;
        if (areaChanged || posChanged) {
          updateProject(item.id, { areaId: null, position: topLevelPos });
        }
        topLevelPos++;
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) {
      setOverId(null);
      return;
    }
    const currentOverId = over.id as string;
    setOverId(currentOverId);
    if (currentOverId.startsWith("area-")) {
      const areaId = currentOverId.replace("area-", "");
      setCollapsedAreas((prev) => {
        if (!prev.has(areaId)) return prev;
        const next = new Set(prev);
        next.delete(areaId);
        return next;
      });
    }
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-sidebar-border bg-sidebar-background">
      <div className="flex items-center gap-2 px-4 py-3">
        <img src="/icon.svg" alt="odot" className="h-6 w-6 rounded" />
        <h1 className="text-lg font-semibold text-sidebar-foreground">odot</h1>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2">
        <div className="space-y-0.5">
          <div {...viewDropHandlers("inbox")}>
            <SidebarItem
              icon={Inbox}
              label={t("sidebar.inbox")}
              color="#3b82f6"
              count={inboxTodos.length}
              alert={overdue(inboxTodos)}
              isActive={isActive({ kind: "inbox" })}
              isDragOver={dragOverViewId === "inbox"}
              onClick={() => setActiveView({ kind: "inbox" })}
            />
          </div>
          <div {...viewDropHandlers("today")}>
            <SidebarItem
              icon={Sun}
              label={t("sidebar.today")}
              color="#f59e0b"
              count={todayTodos.length}
              alert={overdue(todayTodos)}
              isActive={isActive({ kind: "today" })}
              isDragOver={dragOverViewId === "today"}
              onClick={() => setActiveView({ kind: "today" })}
            />
          </div>
          <div {...viewDropHandlers("anytime")}>
            <SidebarItem
              icon={Repeat}
              label={t("sidebar.anytime")}
              color="#8b5cf6"
              isActive={isActive({ kind: "anytime" })}
              isDragOver={dragOverViewId === "anytime"}
              onClick={() => setActiveView({ kind: "anytime" })}
            />
          </div>
          <div {...viewDropHandlers("upcoming")}>
            <SidebarItem
              icon={Calendar}
              label={t("sidebar.upcoming")}
              color="#ef4444"
              isActive={isActive({ kind: "upcoming" })}
              isDragOver={dragOverViewId === "upcoming"}
              onClick={() => setActiveView({ kind: "upcoming" })}
            />
          </div>
          <div {...viewDropHandlers("someday")}>
            <SidebarItem
              icon={Clock}
              label={t("sidebar.someday")}
              color="#a78bfa"
              isActive={isActive({ kind: "someday" })}
              isDragOver={dragOverViewId === "someday"}
              onClick={() => setActiveView({ kind: "someday" })}
            />
          </div>
          <SidebarItem
            icon={BookOpen}
            label={t("sidebar.logbook")}
            color="#10b981"
            isActive={isActive({ kind: "logbook" })}
            onClick={() => setActiveView({ kind: "logbook" })}
          />
          <SidebarItem
            icon={Archive}
            label={t("sidebar.archive")}
            color="#9ca3af"
            isActive={isActive({ kind: "archive" })}
            onClick={() => setActiveView({ kind: "archive" })}
          />
          <SidebarItem
            icon={Trash2}
            label={t("sidebar.trash")}
            color="#6b7280"
            isActive={isActive({ kind: "trash" })}
            onClick={() => setActiveView({ kind: "trash" })}
          />
        </div>

        <Separator className="my-3" />

        {/* Workspace section */}
        <div className="mb-1 px-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("sidebar.workspace")}
          </span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e) => setActiveDragId(e.active.id as string)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => { setActiveDragId(null); setOverId(null); }}
          onDragOver={handleDragOver}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-0.5">
              {flatItems.map((item, flatIdx) => {
                if (item.kind === "gap") {
                  const sortableId = `gap-${item.areaId}`;
                  return (
                    <SortableGap
                      key={sortableId}
                      id={sortableId}
                      dropIndicator={dropIndicatorId === sortableId ? dropIndicatorPosition : null}
                      dropIndented={dropIndicatorId === sortableId && dropIndicatorIndented}
                    />
                  );
                }

                if (item.kind === "area") {
                  const area = areas.find((a) => a.id === item.id)!;
                  const isCollapsed = collapsedAreas.has(area.id);
                  const sortableId = `area-${area.id}`;

                  return (
                    <SortableAreaHeader
                      key={sortableId}
                      id={sortableId}
                      dropIndicator={dropIndicatorId === sortableId ? dropIndicatorPosition : null}
                      dropIndented={dropIndicatorId === sortableId && dropIndicatorIndented}
                    >
                      <div className="flex items-center">
                        <button
                          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-sidebar-foreground"
                          onClick={() => toggleArea(area.id)}
                          aria-label={isCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                            isActive({ kind: "area", areaId: area.id })
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              : "text-sidebar-foreground"
                          }`}
                          onClick={() =>
                            setActiveView({ kind: "area", areaId: area.id })
                          }
                        >
                          <Box className="h-4 w-4 shrink-0" style={{ color: "#06b6d4" }} />
                          <span className="truncate">{area.name}</span>
                        </button>
                        <button
                          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-sidebar-foreground"
                          aria-label={t("sidebar.addProjectToArea")}
                          onClick={() => setAddingProjectInArea(area.id)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </SortableAreaHeader>
                  );
                } else {
                  const project = projects.find((p) => p.id === item.id)!;
                  const sortableId = `project-${project.id}`;
                  const isChild = item.parentAreaId !== null;

                  // Check if this is the last child of its area — render inline input after it
                  const isLastChildOfArea = isChild && (() => {
                    const nextItem = flatItems[flatIdx + 1];
                    // Next item is a gap or area or different parent → this is the last child
                    return !nextItem || nextItem.kind !== "project" || nextItem.parentAreaId !== item.parentAreaId;
                  })();

                  return (
                    <div
                      key={sortableId}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDragOverProjectId(project.id);
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setDragOverProjectId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverProjectId(null);
                        const raw = e.dataTransfer.getData("application/x-todo-ids");
                        if (!raw) return;
                        const ids: string[] = JSON.parse(raw);
                        for (const id of ids) {
                          updateTodo(id, { projectId: project.id });
                        }
                      }}
                    >
                      <SortableProjectItem
                        id={sortableId}
                        dropIndicator={dropIndicatorId === sortableId ? dropIndicatorPosition : null}
                        dropIndented={dropIndicatorId === sortableId && dropIndicatorIndented}
                      >
                        <div className={isChild ? "ml-4" : ""}>
                          <SidebarItem
                            icon={FolderOpen}
                            label={project.name ?? ""}
                            color={project.color ?? undefined}
                            progress={projectProgress(project.id)}
                            isActive={isActive({ kind: "project", projectId: project.id })}
                            isDragOver={dragOverProjectId === project.id}
                            onClick={() =>
                              setActiveView({ kind: "project", projectId: project.id })
                            }
                          />
                        </div>
                      </SortableProjectItem>
                      {isLastChildOfArea && addingProjectInArea === item.parentAreaId && (
                        <div className="ml-4">
                          <SidebarInlineInput
                            placeholder={t("sidebar.projectNamePlaceholder")}
                            onSubmit={(name) =>
                              handleCreateProjectInArea(name, item.parentAreaId!)
                            }
                            onCancel={() => setAddingProjectInArea(null)}
                          />
                        </div>
                      )}
                    </div>
                  );
                }
              })}

              {/* Inline input for adding project to an area with no children yet (or collapsed) */}
              {addingProjectInArea && !flatItems.some((i) => i.kind === "project" && i.parentAreaId === addingProjectInArea) && (
                <div className="ml-4">
                  <SidebarInlineInput
                    placeholder={t("sidebar.projectNamePlaceholder")}
                    onSubmit={(name) =>
                      handleCreateProjectInArea(name, addingProjectInArea)
                    }
                    onCancel={() => setAddingProjectInArea(null)}
                  />
                </div>
              )}

              {areas.length === 0 && ungroupedProjects.length === 0 && !addingArea && !addingUngroupedProject && (
                <p className="px-2 py-1 text-xs text-muted-foreground">
                  {t("sidebar.noProjectsYet")}
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
        {addingArea && (
          <SidebarInlineInput
            placeholder={t("sidebar.areaNamePlaceholder")}
            onSubmit={handleCreateArea}
            onCancel={() => setAddingArea(false)}
          />
        )}
        {addingUngroupedProject && ungroupedProjects.length === 0 && (
          <SidebarInlineInput
            placeholder={t("sidebar.projectNamePlaceholder")}
            onSubmit={handleCreateUngroupedProject}
            onCancel={() => setAddingUngroupedProject(false)}
          />
        )}
        {!addingArea && !addingUngroupedProject && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t("sidebar.add")}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-40 p-1">
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => setAddingUngroupedProject(true)}
              >
                <FolderOpen className="h-4 w-4" />
                {t("sidebar.project")}
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => setAddingArea(true)}
              >
                <Box className="h-4 w-4" style={{ color: "#06b6d4" }} />
                {t("sidebar.area")}
              </button>
            </PopoverContent>
          </Popover>
        )}

        <Separator className="my-3" />

        {/* Tags section */}
        <div className="mb-1 flex items-center justify-between px-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("sidebar.tags")}
          </span>
          <button
            className="rounded p-0.5 text-muted-foreground hover:text-sidebar-foreground"
            aria-label={t("sidebar.addTag")}
            onClick={() => setAddingTag(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-0.5 pb-4">
          {tags.map((tag) => (
            <SidebarItem
              key={tag.id}
              icon={Tag}
              label={tag.name ?? ""}
              color={tag.color ?? undefined}
              isActive={isActive({ kind: "tag", tagId: tag.id })}
              onClick={() => setActiveView({ kind: "tag", tagId: tag.id })}
            />
          ))}
          {addingTag && (
            <SidebarInlineInput
              placeholder={t("sidebar.tagNamePlaceholder")}
              onSubmit={handleCreateTag}
              onCancel={() => setAddingTag(false)}
            />
          )}
          {tags.length === 0 && !addingTag && (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              {t("sidebar.noTagsYet")}
            </p>
          )}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-2">
        <button
          className="flex items-center gap-2 rounded px-2 py-1 text-xs text-muted-foreground hover:text-sidebar-foreground transition-colors"
          onClick={() => setAccountOpen(true)}
          title={t("sidebar.accountAndSync")}
        >
          <User className="h-3.5 w-3.5" />
          <span>{t("sidebar.account")}</span>
        </button>
        <div className="flex items-center gap-1.5">
          <div
            className={`h-2 w-2 rounded-full ${
              syncIndicator === "synced"
                ? "bg-green-500"
                : syncIndicator === "offline"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            title={
              syncIndicator === "synced"
                ? t("sidebar.synced")
                : syncIndicator === "offline"
                  ? t("sidebar.offline")
                  : t("sidebar.syncError")
            }
          />
          <span className="text-[10px] text-muted-foreground">
            {syncIndicator === "synced"
              ? t("sidebar.synced")
              : syncIndicator === "offline"
                ? t("sidebar.offline")
                : t("sidebar.syncError")}
          </span>
        </div>
        <button
          className="rounded p-1 text-muted-foreground hover:text-sidebar-foreground transition-colors"
          onClick={() => setSettingsOpen(true)}
          title={t("sidebar.settings")}
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
      <AccountDialog open={accountOpen} onOpenChange={setAccountOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
  );
}
