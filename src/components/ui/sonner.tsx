import { Toaster as Sonner } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function Toaster() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <Sonner
      position={isDesktop ? "bottom-right" : "top-center"}
      toastOptions={{
        classNames: {
          toast:
            "bg-background text-foreground border-border shadow-lg",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
