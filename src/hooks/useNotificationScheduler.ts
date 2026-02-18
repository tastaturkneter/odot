import { useEffect } from "react";
import { useQuery } from "@evolu/react";
import { allTodos } from "@/db/queries";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { todayStr } from "@/lib/dates";
import { getPermission, showNotification } from "@/lib/notifications";

const STORAGE_KEY = "odot-last-notification-ts";

export function useNotificationScheduler() {
  const { get } = useSettings();
  const todos = useQuery(allTodos);
  const t = useTranslation();

  const enabled = get("notificationsEnabled") === "1";
  const notificationTime = get("notificationTime") ?? "09:00";
  const frequencyH = Number(get("notificationFrequency") ?? "24");

  useEffect(() => {
    if (!enabled) return;

    function checkAndNotify() {
      if (getPermission() !== "granted") return;

      const now = new Date();
      const [targetH, targetM] = notificationTime.split(":").map(Number);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const targetMinutes = targetH * 60 + targetM;
      if (nowMinutes < targetMinutes) return;

      const lastTs = Number(localStorage.getItem(STORAGE_KEY) ?? "0");
      if (now.getTime() - lastTs < frequencyH * 3_600_000) return;

      const today = todayStr();
      const activeTodos = todos.filter((todo) => !todo.isCompleted);

      const scheduled = activeTodos.filter(
        (todo) => todo.whenDate && todo.whenDate <= today,
      );
      const deadlines = activeTodos.filter(
        (todo) => todo.deadline && todo.deadline <= today,
      );

      if (scheduled.length === 0 && deadlines.length === 0) return;

      localStorage.setItem(STORAGE_KEY, String(now.getTime()));

      for (const todo of scheduled) {
        showNotification(t("notifications.scheduledTitle"), {
          body: String(todo.title),
          tag: `odot-scheduled-${todo.id}`,
        });
      }

      for (const todo of deadlines) {
        showNotification(t("notifications.deadlineTitle"), {
          body: String(todo.title),
          tag: `odot-deadline-${todo.id}`,
        });
      }
    }

    checkAndNotify();
    const id = setInterval(checkAndNotify, 60_000);
    return () => clearInterval(id);
  }, [enabled, notificationTime, frequencyH, todos, t]);
}
