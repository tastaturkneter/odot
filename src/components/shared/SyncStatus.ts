// Evolu's useSyncState isn't exported yet in the current version.
// We use useEvoluError as a lightweight proxy: no error = synced, error = problem.
// Once useSyncState becomes available, this can be upgraded.

export type SyncIndicator = "synced" | "error" | "offline";

export function getSyncIndicator(
  evoluError: unknown | null,
  isOnline: boolean,
): SyncIndicator {
  if (!isOnline) return "offline";
  if (evoluError) return "error";
  return "synced";
}
