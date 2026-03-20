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
import {
  OnboardingTour,
  isTourComplete,
} from "@/components/shared/OnboardingTour";

function MainApp({ showTour, onTourComplete }: { showTour: boolean; onTourComplete: () => void }) {
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
      {showTour && <OnboardingTour onComplete={onTourComplete} />}
    </ViewContext>
  );
}

function App() {
  const [setupDone, setSetupDone] = useState(isSetupComplete);
  const [tourDone, setTourDone] = useState(isTourComplete);

  if (!setupDone) {
    return (
      <>
        <SetupWizard onComplete={() => setSetupDone(true)} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <MainApp showTour={!tourDone} onTourComplete={() => setTourDone(true)} />
      <Toaster />
    </>
  );
}

export default App;
