import { useState, useCallback } from "react";

interface SelectOptions {
  metaKey?: boolean;
  shiftKey?: boolean;
}

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cursorId, setCursorId] = useState<string | null>(null);
  const [anchorId, setAnchorId] = useState<string | null>(null);

  // Clear selection when all selected IDs are removed from the list
  const syncWithList = useCallback((orderedIds: string[]) => {
    setSelectedIds((prev) => {
      const filtered = new Set([...prev].filter((id) => orderedIds.includes(id)));
      if (filtered.size === prev.size) return prev;
      return filtered;
    });
    setCursorId((prev) => {
      if (prev && !orderedIds.includes(prev)) return null;
      return prev;
    });
    setAnchorId((prev) => {
      if (prev && !orderedIds.includes(prev)) return null;
      return prev;
    });
  }, []);

  const handleSelect = useCallback(
    (id: string, orderedIds: string[], opts: SelectOptions = {}) => {
      if (opts.shiftKey && anchorId) {
        // Range selection from anchor to clicked id
        const anchorIdx = orderedIds.indexOf(anchorId);
        const targetIdx = orderedIds.indexOf(id);
        if (anchorIdx !== -1 && targetIdx !== -1) {
          const start = Math.min(anchorIdx, targetIdx);
          const end = Math.max(anchorIdx, targetIdx);
          const rangeIds = orderedIds.slice(start, end + 1);
          setSelectedIds(new Set(rangeIds));
          setCursorId(id);
          // anchor stays
        }
      } else if (opts.metaKey) {
        // Toggle single id in/out of selection
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        setAnchorId(id);
        setCursorId(id);
      } else {
        // Plain click: select only this id
        setSelectedIds(new Set([id]));
        setAnchorId(id);
        setCursorId(id);
      }
    },
    [anchorId],
  );

  const moveDown = useCallback((orderedIds: string[]) => {
    if (orderedIds.length === 0) return;
    setCursorId((prev) => {
      if (!prev) {
        const id = orderedIds[0];
        setSelectedIds(new Set([id]));
        setAnchorId(id);
        return id;
      }
      const idx = orderedIds.indexOf(prev);
      const nextIdx = Math.min(idx + 1, orderedIds.length - 1);
      const id = orderedIds[nextIdx];
      setSelectedIds(new Set([id]));
      setAnchorId(id);
      return id;
    });
  }, []);

  const moveUp = useCallback((orderedIds: string[]) => {
    if (orderedIds.length === 0) return;
    setCursorId((prev) => {
      if (!prev) {
        const id = orderedIds[0];
        setSelectedIds(new Set([id]));
        setAnchorId(id);
        return id;
      }
      const idx = orderedIds.indexOf(prev);
      const nextIdx = Math.max(idx - 1, 0);
      const id = orderedIds[nextIdx];
      setSelectedIds(new Set([id]));
      setAnchorId(id);
      return id;
    });
  }, []);

  const selectOne = useCallback((id: string) => {
    setSelectedIds(new Set([id]));
    setCursorId(id);
    setAnchorId(id);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    setCursorId(null);
    setAnchorId(null);
  }, []);

  const isSingleSelection = useCallback(() => {
    return selectedIds.size === 1;
  }, [selectedIds]);

  const getSingleSelectedId = useCallback((): string | null => {
    if (selectedIds.size !== 1) return null;
    return [...selectedIds][0];
  }, [selectedIds]);

  return {
    selectedIds,
    cursorId,
    handleSelect,
    moveDown,
    moveUp,
    selectOne,
    deselectAll,
    isSingleSelection,
    getSingleSelectedId,
    syncWithList,
  };
}
