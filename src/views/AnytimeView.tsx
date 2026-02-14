import { useMemo } from "react";
import { useQuery } from "@evolu/react";
import { allTodos, allProjects, allAreas } from "@/db/queries";
import type { TodoRow } from "@/db/queries";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { Repeat, Box } from "lucide-react";
import { useTodoActions } from "@/hooks/useTodoActions";
import { useActiveView } from "@/hooks/useActiveView";
import { ProgressCircle } from "@/components/shared/ProgressCircle";

export function AnytimeView() {
  const { setActiveView } = useActiveView();
  const todos = useQuery(allTodos);
  const projects = useQuery(allProjects);
  const areas = useQuery(allAreas);
  const { toggleComplete } = useTodoActions();

  // Anytime todos: open, in a project, no when/someday/deadline
  const anytimeTodos = useMemo(
    () =>
      todos.filter(
        (t) =>
          t.isCompleted !== 1 &&
          t.projectId !== null &&
          !t.whenDate &&
          !t.whenSomeday &&
          !t.deadline,
      ),
    [todos],
  );

  // Projects that have anytime todos
  const projectsWithTodos = useMemo(() => {
    const projectIds = new Set(anytimeTodos.map((t) => t.projectId));
    return projects
      .filter((p) => projectIds.has(p.id))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [anytimeTodos, projects]);

  // Areas that have projects with anytime todos
  const areasWithProjects = useMemo(() => {
    const areaIds = new Set(
      projectsWithTodos.filter((p) => p.areaId).map((p) => p.areaId),
    );
    return areas
      .filter((a) => areaIds.has(a.id))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [projectsWithTodos, areas]);

  const ungroupedProjects = useMemo(
    () => projectsWithTodos.filter((p) => !p.areaId),
    [projectsWithTodos],
  );

  function todosForProject(projectId: string) {
    return anytimeTodos
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }

  function projectProgress(projectId: string) {
    const all = todos.filter((t) => t.projectId === projectId);
    if (all.length === 0) return 0;
    return all.filter((t) => t.isCompleted === 1).length / all.length;
  }

  function handleToggle(id: string, isCompleted: 0 | 1 | null) {
    const todo = todos.find((t) => t.id === id);
    toggleComplete(
      id,
      isCompleted,
      todo
        ? {
            title: todo.title,
            notes: todo.notes,
            projectId: todo.projectId,
            recurrenceRule: todo.recurrenceRule,
            whenDate: todo.whenDate,
            position: todo.position,
          }
        : undefined,
    );
  }

  const isEmpty = projectsWithTodos.length === 0;

  return (
    <div>
      <ViewHeader
        title="Anytime"
        icon={<Repeat className="h-6 w-6" style={{ color: "#8b5cf6" }} />}
      />

      {isEmpty ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No anytime todos.
        </p>
      ) : (
        <div>
          {areasWithProjects.map((area, areaIdx) => {
            const areaProjectList = projectsWithTodos.filter(
              (p) => p.areaId === area.id,
            );
            return (
              <div key={area.id} className={areaIdx > 0 ? "mt-8" : undefined}>
                <button
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 border-b border-border text-sm font-bold text-foreground hover:bg-accent transition-colors"
                  onClick={() =>
                    setActiveView({ kind: "area", areaId: area.id })
                  }
                >
                  <Box
                    className="h-4 w-4 shrink-0"
                    style={{ color: "#06b6d4" }}
                  />
                  {area.name}
                </button>
                <div className="mt-2 space-y-5">
                  {areaProjectList.map((project) => (
                    <ProjectBlock
                      key={project.id}
                      name={project.name ?? ""}
                      color={project.color ?? undefined}
                      progress={projectProgress(project.id)}
                      todos={todosForProject(project.id)}
                      onToggle={handleToggle}
                      onClick={() =>
                        setActiveView({
                          kind: "project",
                          projectId: project.id,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {ungroupedProjects.length > 0 && (
            <div className={areasWithProjects.length > 0 ? "mt-8 space-y-5" : "space-y-5"}>
              {ungroupedProjects.map((project) => (
                <ProjectBlock
                  key={project.id}
                  name={project.name ?? ""}
                  color={project.color ?? undefined}
                  progress={projectProgress(project.id)}
                  todos={todosForProject(project.id)}
                  onToggle={handleToggle}
                  onClick={() =>
                    setActiveView({
                      kind: "project",
                      projectId: project.id,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectBlock({
  name,
  color,
  progress,
  todos,
  onToggle,
  onClick,
}: {
  name: string;
  color?: string;
  progress: number;
  todos: TodoRow[];
  onToggle: (id: string, isCompleted: 0 | 1 | null) => void;
  onClick: () => void;
}) {
  return (
    <div>
      <button
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 border-b border-border text-sm font-bold text-foreground hover:bg-accent transition-colors"
        onClick={onClick}
      >
        <ProgressCircle
          progress={progress}
          color={color}
          className="h-4 w-4"
        />
        {name}
      </button>
      <div className="mt-1 space-y-0.5">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5"
          >
            <Checkbox
              checked={todo.isCompleted === 1}
              onCheckedChange={() => onToggle(todo.id, todo.isCompleted)}
              className="h-4 w-4 shrink-0"
            />
            <span className="truncate text-sm">{todo.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
