import { createEvolu } from "@evolu/common";
import { evoluReactWebDeps } from "@evolu/react-web";
import { createUseEvolu } from "@evolu/react";
import { Schema } from "./schema";

const SYNC_URL_KEY = "evolu-sync-url";
const DEFAULT_SYNC_URL =
  (window as unknown as Record<string, unknown>).__ODOT_SYNC_URL__ as string ||
  "wss://free.evoluhq.com";

function getSyncUrl(): string {
  try {
    return localStorage.getItem(SYNC_URL_KEY) || DEFAULT_SYNC_URL;
  } catch {
    return DEFAULT_SYNC_URL;
  }
}

export { SYNC_URL_KEY, DEFAULT_SYNC_URL };

const evolu = createEvolu(evoluReactWebDeps)(Schema, {
  transports: [{ type: "WebSocket", url: getSyncUrl() }],
  indexes: (create) => [
    create("todoWhenDate").on("todo").column("whenDate"),
    create("todoProjectId").on("todo").column("projectId"),
    create("todoPosition").on("todo").column("position"),
    create("todoTagTodoId").on("todoTag").column("todoId"),
    create("todoTagTagId").on("todoTag").column("tagId"),
    create("checklistItemTodoId").on("checklistItem").column("todoId"),
    create("checklistItemPosition").on("checklistItem").column("position"),
    create("projectAreaId").on("project").column("areaId"),
    create("projectHeadingProjectId").on("projectHeading").column("projectId"),
    create("projectHeadingPosition").on("projectHeading").column("position"),
    create("settingKey").on("setting").column("key"),
  ],
});

const useEvolu = createUseEvolu(evolu);

export { evolu, useEvolu };
