import { useQuery } from "@evolu/react";
import { archivedProjects, allTodos } from "@/db/queries";
import { ViewHeader } from "@/components/shared/ViewHeader";
import { ProgressCircle } from "@/components/shared/ProgressCircle";
import { Archive, RotateCcw } from "lucide-react";
import { useProjectActions } from "@/hooks/useProjectActions";
import { useActiveView } from "@/hooks/useActiveView";
import { useTranslation } from "@/hooks/useTranslation";

export function ArchiveView() {
  const t = useTranslation();
  const projects = useQuery(archivedProjects);
  const todos = useQuery(allTodos);
  const { unarchiveProject } = useProjectActions();
  const { setActiveView } = useActiveView();

  function projectProgress(projectId: string): number {
    const all = todos.filter((t) => t.projectId === projectId);
    if (all.length === 0) return 0;
    return all.filter((t) => t.isCompleted === 1).length / all.length;
  }

  return (
    <div>
      <ViewHeader
        title={t("sidebar.archive")}
        icon={<Archive className="h-6 w-6" style={{ color: "#9ca3af" }} />}
      />
      {projects.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("view.archiveEmpty")}
        </p>
      ) : (
        <div className="space-y-0.5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/50"
            >
              <ProgressCircle
                progress={projectProgress(project.id)}
                color={project.color ?? undefined}
                className="h-5 w-5 shrink-0"
              />
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() =>
                  setActiveView({ kind: "project", projectId: project.id })
                }
              >
                <span className="text-sm text-foreground hover:underline">
                  {project.name}
                </span>
              </button>
              <button
                className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                onClick={() => unarchiveProject(project.id)}
                title={t("view.unarchive")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("view.unarchive")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
