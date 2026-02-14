import { createContext, useContext } from "react";
import type { ActiveView } from "@/lib/views";

interface ViewContextValue {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  newModalOpen: boolean;
  setNewModalOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const ViewContext = createContext<ViewContextValue | null>(null);

export function useActiveView(): ViewContextValue {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useActiveView must be used within ViewContext");
  return ctx;
}
