import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKeys } from "@/i18n/en";
import { useActiveView } from "@/hooks/useActiveView";
import { Button } from "@/components/ui/button";

const TOUR_COMPLETE_KEY = "odot-tour-complete";

export function isTourComplete(): boolean {
  try {
    return localStorage.getItem(TOUR_COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

function markTourComplete(): void {
  try {
    localStorage.setItem(TOUR_COMPLETE_KEY, "1");
  } catch {
    // ignore
  }
}

interface TourStep {
  target: string;
  titleKey: TranslationKeys;
  descriptionKey: TranslationKeys;
  position?: "top" | "bottom" | "left" | "right";
  onEnter?: () => void;
  onLeave?: () => void;
}

interface OnboardingTourProps {
  onComplete: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const TOOLTIP_GAP = 12;
const TOOLTIP_WIDTH = 288;

function findTarget(target: string): Element | null {
  return document.querySelector(`[data-tour="${target}"]`);
}

function getRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function useTargetRect(target: string) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    setRect(null);

    function measure() {
      const el = findTarget(target);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setRect(getRect(el));
          el.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return true;
        }
      }
      return false;
    }

    if (measure()) return;

    const interval = setInterval(() => {
      if (measure()) clearInterval(interval);
    }, 150);

    const observer = new MutationObserver(() => {
      if (measure()) {
        clearInterval(interval);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [target]);

  useEffect(() => {
    function update() {
      const el = findTarget(target);
      if (el) setRect(getRect(el));
    }
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [target]);

  return rect;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [current, setCurrent] = useState(0);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const t = useTranslation();
  const { setNewModalOpen } = useActiveView();

  const openModal = useCallback(() => setNewModalOpen(true), [setNewModalOpen]);
  const closeModal = useCallback(() => setNewModalOpen(false), [setNewModalOpen]);

  const steps: TourStep[] = [
    {
      target: "tour-sidebar-views",
      titleKey: "tour.viewsTitle",
      descriptionKey: "tour.viewsDescription",
      position: "right",
    },
    {
      target: "tour-new-button",
      titleKey: "tour.createTitle",
      descriptionKey: "tour.createDescription",
      position: "bottom",
    },
    {
      target: "tour-modal-title",
      titleKey: "tour.modalTitleTitle",
      descriptionKey: "tour.modalTitleDescription",
      position: "bottom",
      onEnter: openModal,
    },
    {
      target: "tour-modal-notes",
      titleKey: "tour.modalNotesTitle",
      descriptionKey: "tour.modalNotesDescription",
      position: "bottom",
    },
    {
      target: "tour-modal-pickers",
      titleKey: "tour.modalPickersTitle",
      descriptionKey: "tour.modalPickersDescription",
      position: "bottom",
      onLeave: closeModal,
    },
    {
      target: "tour-workspace",
      titleKey: "tour.organizeTitle",
      descriptionKey: "tour.organizeDescription",
      position: "right",
    },
    {
      target: "tour-tags",
      titleKey: "tour.tagsTitle",
      descriptionKey: "tour.tagsDescription",
      position: "right",
    },
    {
      target: "tour-account",
      titleKey: "tour.accountTitle",
      descriptionKey: "tour.accountDescription",
      position: "top",
    },
    {
      target: "tour-settings",
      titleKey: "tour.settingsTitle",
      descriptionKey: "tour.settingsDescription",
      position: "top",
    },
  ];

  const step = steps[current];
  const targetRect = useTargetRect(step.target);

  // Fire onEnter when step changes
  const prevStepRef = useRef(current);
  useEffect(() => {
    if (prevStepRef.current !== current) {
      // Fire onLeave for old step
      steps[prevStepRef.current]?.onLeave?.();
      prevStepRef.current = current;
    }
    step.onEnter?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  function handleNext() {
    if (current < steps.length - 1) {
      setCurrent((s) => s + 1);
    } else {
      finish();
    }
  }

  function handleBack() {
    if (current > 0) {
      setCurrent((s) => s - 1);
    }
  }

  function finish() {
    // Clean up: close modal if open
    step.onLeave?.();
    closeModal();
    markTourComplete();
    onComplete();
  }

  const pos = step.position ?? "bottom";
  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 103,
    width: TOOLTIP_WIDTH,
  };

  if (targetRect) {
    const cx = targetRect.left + targetRect.width / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;

    switch (pos) {
      case "right": {
        const leftPos = targetRect.left + targetRect.width + PADDING + TOOLTIP_GAP;
        if (leftPos + TOOLTIP_WIDTH > vw - margin) {
          tooltipStyle.left = clamp(cx - TOOLTIP_WIDTH / 2, margin, vw - TOOLTIP_WIDTH - margin);
          tooltipStyle.top = targetRect.top + targetRect.height + PADDING + TOOLTIP_GAP;
        } else {
          tooltipStyle.left = leftPos;
          tooltipStyle.top = clamp(
            targetRect.top + targetRect.height / 2,
            margin,
            vh - 220,
          );
          tooltipStyle.transform = "translateY(-50%)";
        }
        break;
      }
      case "left": {
        const rightEdge = targetRect.left - PADDING - TOOLTIP_GAP - TOOLTIP_WIDTH;
        if (rightEdge < margin) {
          tooltipStyle.left = clamp(cx - TOOLTIP_WIDTH / 2, margin, vw - TOOLTIP_WIDTH - margin);
          tooltipStyle.top = targetRect.top + targetRect.height + PADDING + TOOLTIP_GAP;
        } else {
          tooltipStyle.left = rightEdge;
          tooltipStyle.top = clamp(
            targetRect.top + targetRect.height / 2,
            margin,
            vh - 220,
          );
          tooltipStyle.transform = "translateY(-50%)";
        }
        break;
      }
      case "bottom":
        tooltipStyle.left = clamp(cx - TOOLTIP_WIDTH / 2, margin, vw - TOOLTIP_WIDTH - margin);
        tooltipStyle.top = clamp(
          targetRect.top + targetRect.height + PADDING + TOOLTIP_GAP,
          margin,
          vh - 220,
        );
        break;
      case "top":
        tooltipStyle.left = clamp(cx - TOOLTIP_WIDTH / 2, margin, vw - TOOLTIP_WIDTH - margin);
        tooltipStyle.bottom = clamp(
          vh - targetRect.top + PADDING + TOOLTIP_GAP,
          margin,
          vh - 60,
        );
        break;
    }
  } else {
    tooltipStyle.left = "50%";
    tooltipStyle.top = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
  }

  return (
    <div
      className="fixed inset-0 z-[100]"
      style={{ pointerEvents: "none" }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Overlay with spotlight cutout */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ zIndex: 101, pointerEvents: "auto" }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - PADDING}
                y={targetRect.top - PADDING}
                width={targetRect.width + PADDING * 2}
                height={targetRect.height + PADDING * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight border highlight */}
      {targetRect && (
        <div
          className="absolute rounded-lg ring-2 ring-primary"
          style={{
            zIndex: 102,
            top: targetRect.top - PADDING,
            left: targetRect.left - PADDING,
            width: targetRect.width + PADDING * 2,
            height: targetRect.height + PADDING * 2,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Tooltip */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        ref={tooltipRef}
        style={{ ...tooltipStyle, zIndex: 103, pointerEvents: "auto" }}
        className="rounded-lg border bg-popover p-4 shadow-lg"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 rounded p-1 text-muted-foreground hover:text-foreground"
          onClick={finish}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <p className="mb-1 text-xs text-muted-foreground">
          {current + 1} / {steps.length}
        </p>

        <h3 className="text-sm font-semibold">{t(step.titleKey)}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(step.descriptionKey)}
        </p>

        <div className="mt-3 flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === current ? "bg-primary" : i < current ? "bg-primary/40" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          {current > 0 ? (
            <Button variant="outline" size="sm" onClick={handleBack} className="gap-1">
              <ChevronLeft className="h-3.5 w-3.5" />
              {t("setup.back")}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={finish} className="text-muted-foreground">
              {t("setup.skip")}
            </Button>
          )}
          <div className="flex-1" />
          <Button size="sm" onClick={handleNext} className="gap-1">
            {current < steps.length - 1 ? t("setup.next") : t("tour.start")}
            {current < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
