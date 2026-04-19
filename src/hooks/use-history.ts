import { useRef, useState, useCallback, useEffect } from 'react';

interface HistoryState<T> {
  past: T[];
  future: T[];
}

const MAX_HISTORY = 50;

/**
 * Tracks snapshots of a value and exposes undo/redo.
 * Snapshots are taken on a debounce so rapid edits collapse into a single entry.
 * The hook is "passive": it watches `value` and calls `onRestore` when undo/redo runs.
 */
export function useHistory<T>(
  value: T,
  onRestore: (v: T) => void,
  options: { debounceMs?: number; serialize?: (v: T) => string } = {}
) {
  const { debounceMs = 400, serialize = (v) => JSON.stringify(v) } = options;
  const [hist, setHist] = useState<HistoryState<T>>({ past: [], future: [] });
  const lastSnapshotRef = useRef<string>(serialize(value));
  const isRestoringRef = useRef(false);
  const initializedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      lastSnapshotRef.current = serialize(value);
      return;
    }
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      lastSnapshotRef.current = serialize(value);
      return;
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const snapshotValue = value;
    timerRef.current = window.setTimeout(() => {
      const serialized = serialize(snapshotValue);
      if (serialized === lastSnapshotRef.current) return;
      const prevSnapshot = lastSnapshotRef.current;
      lastSnapshotRef.current = serialized;
      setHist((h) => {
        const past = [...h.past, JSON.parse(prevSnapshot) as T];
        if (past.length > MAX_HISTORY) past.shift();
        return { past, future: [] };
      });
    }, debounceMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [value, serialize, debounceMs]);

  const undo = useCallback(() => {
    setHist((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, -1);
      const currentSnapshot = JSON.parse(lastSnapshotRef.current) as T;
      isRestoringRef.current = true;
      lastSnapshotRef.current = serialize(previous);
      onRestore(previous);
      return { past: newPast, future: [currentSnapshot, ...h.future] };
    });
  }, [onRestore, serialize]);

  const redo = useCallback(() => {
    setHist((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      const newFuture = h.future.slice(1);
      const currentSnapshot = JSON.parse(lastSnapshotRef.current) as T;
      isRestoringRef.current = true;
      lastSnapshotRef.current = serialize(next);
      onRestore(next);
      return { past: [...h.past, currentSnapshot], future: newFuture };
    });
  }, [onRestore, serialize]);

  const reset = useCallback((v: T) => {
    isRestoringRef.current = true;
    lastSnapshotRef.current = serialize(v);
    setHist({ past: [], future: [] });
  }, [serialize]);

  return {
    undo,
    redo,
    reset,
    canUndo: hist.past.length > 0,
    canRedo: hist.future.length > 0,
  };
}
