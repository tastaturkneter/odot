import { useState } from "react";
import { ViewContext } from "@/hooks/useActiveView";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { useViewRouter } from "@/hooks/useViewRouter";
import { useNotificationScheduler } from "@/hooks/useNotificationScheduler";
import {
  SetupWizard,
  isSetupComplete,
} from "@/components/shared/SetupWizard";

function MainApp() {
  const [activeView, setActiveView] = useViewRouter();
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useNotificationScheduler();

  return (
    <ViewContext
      value={{
        activeView,
        setActiveView,
        newModalOpen,
        setNewModalOpen,
        searchOpen,
        setSearchOpen,
        sidebarOpen,
        setSidebarOpen,
      }}
    >
      <AppShell />
    </ViewContext>
  );
}

function App() {
  const [setupDone, setSetupDone] = useState(isSetupComplete);

  return (
    <>
      {setupDone ? (
        <MainApp />
      ) : (
        <SetupWizard onComplete={() => setSetupDone(true)} />
      )}
      <Toaster />
    </>
  );
}

export default App;
