import { useCallback } from "react";
import { useQuery } from "@evolu/react";
import { allSettings } from "@/db/queries";
import { useEvolu } from "@/db/evolu";

export function useSettings() {
  const evolu = useEvolu();
  const settings = useQuery(allSettings);

  const get = useCallback(
    (key: string): string | null => {
      const row = settings.find((s) => s.key === key);
      return row?.value ?? null;
    },
    [settings],
  );

  const set = useCallback(
    (key: string, value: string) => {
      const existing = settings.find((s) => s.key === key);
      if (existing) {
        evolu.update("setting", { id: existing.id, value } as never);
      } else {
        evolu.insert("setting", { key, value } as never);
      }
    },
    [evolu, settings],
  );

  return { get, set };
}
