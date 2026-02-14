import { useState } from "react";
import { Plus, CheckSquare, FolderOpen, Box, Heading2 } from "lucide-react";
import { useQuery } from "@evolu/react";
import { useActiveView } from "@/hooks/useActiveView";
import { useProjectActions } from "@/hooks/useProjectActions";
import { useAreaActions } from "@/hooks/useAreaActions";
import { useHeadingActions } from "@/hooks/useHeadingActions";
import { allProjects, allAreas, allTodos, allProjectHeadings } from "@/db/queries";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export function FloatingCreateButton() {
  const { activeView, setActiveView, setNewModalOpen } = useActiveView();
  const { createProject } = useProjectActions();
  const { createArea } = useAreaActions();
  const { createHeading } = useHeadingActions();

  const projects = useQuery(allProjects);
  const areas = useQuery(allAreas);
  const todos = useQuery(allTodos);
  const projectHeadings = useQuery(allProjectHeadings);

  const [popoverOpen, setPopoverOpen] = useState(false);

  const isProjectView = activeView.kind === "project";

  function handleCreateProject() {
    const result = createProject("New Project", projects.length);
    if (result.ok) {
      setActiveView({ kind: "project", projectId: result.value.id });
    }
  }

  function handleCreateArea() {
    const result = createArea("New Area", areas.length);
    if (result.ok) {
      setActiveView({ kind: "area", areaId: result.value.id });
    }
  }

  function handleCreateHeading() {
    if (!isProjectView) return;
    const projectId = activeView.projectId;
    const projectItems = [
      ...todos.filter((t) => t.projectId === projectId),
      ...projectHeadings.filter((h) => h.projectId === projectId),
    ];
    const maxPos = projectItems.length > 0
      ? Math.max(...projectItems.map((i) => i.position ?? 0))
      : -1;
    createHeading(projectId, "New Heading", maxPos + 1);
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon-lg"
          className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg"
          aria-label="Create new item"
        >
          <Plus className="h-7 w-7" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-48 p-1">
        <button
          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
          onClick={() => {
            setPopoverOpen(false);
            setNewModalOpen(true);
          }}
        >
          <CheckSquare className="h-4 w-4" />
          Todo
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
          onClick={() => {
            setPopoverOpen(false);
            handleCreateProject();
          }}
        >
          <FolderOpen className="h-4 w-4" />
          Project
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
          onClick={() => {
            setPopoverOpen(false);
            handleCreateArea();
          }}
        >
          <Box className="h-4 w-4 text-cyan-500" />
          Area
        </button>
        {isProjectView && (
          <button
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
            onClick={() => {
              setPopoverOpen(false);
              handleCreateHeading();
            }}
          >
            <Heading2 className="h-4 w-4" />
            Heading
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
