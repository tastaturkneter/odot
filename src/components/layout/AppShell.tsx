import { Suspense } from "react";
import { Menu } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { useActiveView } from "@/hooks/useActiveView";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { FloatingCreateButton } from "@/components/shared/FloatingCreateButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { InboxView } from "@/views/InboxView";
import { TodayView } from "@/views/TodayView";
import { UpcomingView } from "@/views/UpcomingView";
import { SomedayView } from "@/views/SomedayView";
import { LogbookView } from "@/views/LogbookView";
import { ProjectView } from "@/views/ProjectView";
import { TagView } from "@/views/TagView";
import { AreaView } from "@/views/AreaView";
import { TrashView } from "@/views/TrashView";
import { AnytimeView } from "@/views/AnytimeView";

function ActiveViewContent() {
  const { activeView } = useActiveView();

  switch (activeView.kind) {
    case "inbox":
      return <InboxView />;
    case "today":
      return <TodayView />;
    case "anytime":
      return <AnytimeView />;
    case "upcoming":
      return <UpcomingView />;
    case "someday":
      return <SomedayView />;
    case "logbook":
      return <LogbookView />;
    case "trash":
      return <TrashView />;
    case "project":
      return <ProjectView projectId={activeView.projectId} />;
    case "tag":
      return <TagView tagId={activeView.tagId} />;
    case "area":
      return <AreaView areaId={activeView.areaId} />;
  }
}

export function AppShell() {
  const { searchOpen, setSearchOpen, sidebarOpen, setSidebarOpen } =
    useActiveView();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const t = useTranslation();

  return (
    <div className="flex h-screen overflow-hidden">
      {isDesktop ? (
        <Suspense>
          <Sidebar />
        </Suspense>
      ) : (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-60 p-0">
            <Suspense>
              <Sidebar />
            </Suspense>
          </SheetContent>
        </Sheet>
      )}
      <MainContent>
        {!isDesktop && (
          <div className="mb-4 flex items-center">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        )}
        <Suspense
          fallback={
            <p className="text-sm text-muted-foreground">{t("app.loading")}</p>
          }
        >
          <ActiveViewContent />
        </Suspense>
      </MainContent>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <FloatingCreateButton />
    </div>
  );
}
