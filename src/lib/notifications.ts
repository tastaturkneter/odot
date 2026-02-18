export function isSupported(): boolean {
  return "Notification" in window;
}

export function getPermission(): NotificationPermission {
  if (!isSupported()) return "denied";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isSupported()) return "denied";
  return Notification.requestPermission();
}

export function showNotification(
  title: string,
  options?: { body?: string; tag?: string },
): void {
  if (!isSupported() || Notification.permission !== "granted") return;
  new Notification(title, options);
}
