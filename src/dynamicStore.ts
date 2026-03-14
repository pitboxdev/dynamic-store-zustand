import { create, type StoreApi, type UseBoundStore } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useCallback, useMemo, useRef } from "react";
import type {
  SetStateAction,
  StoreConfig,
  DynamicStoreRegistry,
  StoreState,
  ResetScope,
  ResetOptions,
  DynamicStoreConfig,
} from "./types";



// ─── Internal manager state ───────────────────────────────────────────────────

interface DynamicStoresState {
  stores: Record<string, DynamicStoreRegistry>;
  setStoreData: (
    storeId: string,
    data: StoreState,
    config?: StoreConfig,
  ) => void;
  resetStore: (storeId: string) => void;
  resetDynamicStores: (scope: ResetScope, options?: ResetOptions) => void;
}

let useDynamicStoresManager: UseBoundStore<StoreApi<DynamicStoresState>> | undefined;

/**
 * Creates and configures the global dynamic store manager.
 */
export function createDynamicStore(config: DynamicStoreConfig = {}) {
  if (useDynamicStoresManager) {
    return useDynamicStoresManager;
  }

  const { devTools = true, middlewares = [], initialState = {} } = config;

  const managerCreator = (set: any) => ({
    stores: initialState as Record<string, DynamicStoreRegistry>,

    setStoreData: (storeId: string, data: StoreState, cfg?: StoreConfig) => {
      set((state: DynamicStoresState) => {
        const existingStore = state.stores[storeId];
        const currentData: StoreState =
          existingStore?.data ?? cfg?.initialState ?? {};

        const entry: DynamicStoreRegistry = {
          data: { ...currentData, ...data },
          config: cfg ?? existingStore?.config ?? {},
          initialState: cfg?.initialState ?? existingStore?.initialState ?? {},
        };

        return {
          stores: { ...state.stores, [storeId]: entry },
        };
      });
    },

    resetStore: (storeId: string) => {
      set((state: DynamicStoresState) => {
        const store = state.stores[storeId];
        if (!store) return state;

        return {
          stores: {
            ...state.stores,
            [storeId]: { ...store, data: { ...store.initialState } },
          },
        };
      });
    },

    resetDynamicStores: (scope: ResetScope, options?: ResetOptions) => {
      set((state: DynamicStoresState) => {
        const next: Record<string, DynamicStoreRegistry> = {};
        const excludeGroups = options?.excludeGroups;

        for (const [id, store] of Object.entries(state.stores)) {
          const { persistOnNavigation, navigationGroups } = store.config || {};

          // 0. Check exclusion
          if (
            excludeGroups &&
            navigationGroups?.some((g) => excludeGroups.includes(g))
          ) {
            next[id] = store;
            continue;
          }

          // 1. Reset everything
          if (scope === "all") {
            next[id] = { ...store, data: { ...store.initialState } };
            continue;
          }

          // 2. Explicit group reset
          if (Array.isArray(scope)) {
            const hasMatch = navigationGroups?.some((group) =>
              scope.includes(group),
            );
            if (hasMatch) {
              next[id] = { ...store, data: { ...store.initialState } };
            } else {
              next[id] = store;
            }
            continue;
          }

          // 3. Default non-persistent reset
          next[id] =
            persistOnNavigation === true
              ? store
              : { ...store, data: { ...store.initialState } };
        }

        return { stores: next };
      });
    },
  });

  // Apply devtools if enabled
  let finalCreator = managerCreator;
  if (devTools) {
    finalCreator = devtools(managerCreator, {
      name: "DynamicStoresManager",
      ...(typeof devTools === "object" ? devTools : {}),
    }) as any;
  }

  // Apply extra middlewares
  middlewares.forEach((mw) => {
    finalCreator = mw(finalCreator) as any;
  });

  useDynamicStoresManager = create<DynamicStoresState>()(finalCreator as any);
  return useDynamicStoresManager;
}

/**
 * Internal helper to ensure the manager has been initialized.
 */
function ensureManager() {
  if (!useDynamicStoresManager) {
    return createDynamicStore();
  }
  return useDynamicStoresManager;
}

// ─── Return types ─────────────────────────────────────────────────────────────

export interface UseDynamicStoreMethodsReturn<T extends StoreState> {
  setData: (updater: SetStateAction<T>) => void;
  reset: () => void;
  getData: () => T;
}

export interface UseDynamicStoreReturn<T extends StoreState, U = T> {
  data: U;
  setData: (updater: SetStateAction<T>) => void;
  reset: () => void;
  getData: () => T;
}

// ─── useDynamicStoreMethods ───────────────────────────────────────────────────

/**
 * Hook that returns store methods (setData, reset, get) WITHOUT subscribing
 * to state changes. Useful when you only need to update or read the store
 * imperatively without causing component re-renders.
 */
export function useDynamicStoreMethods<T extends StoreState>(
  storeId: string,
  config?: StoreConfig<T>,
): UseDynamicStoreMethodsReturn<T> {
  const manager = ensureManager();
  const { setStoreData, resetStore } = manager(
    useShallow((state) => ({
      setStoreData: state.setStoreData,
      resetStore: state.resetStore,
    })),
  );

  // Use ref for config to keep methods stable even if config object is unstable
  const configRef = useRef(config);
  configRef.current = config;

  const getData = useCallback((): T => {
    const manager = ensureManager();
    const storeRegistry = manager.getState().stores[storeId];
    return (storeRegistry?.data ?? configRef.current?.initialState ?? {}) as T;
  }, [storeId]);

  const setData = useCallback(
    (updater: SetStateAction<T>): void => {
      const currentConfig = configRef.current;
      if (typeof updater === "function") {
        const updates = updater(getData());
        setStoreData(
          storeId,
          updates as StoreState,
          currentConfig as StoreConfig | undefined,
        );
      } else {
        setStoreData(
          storeId,
          updater as StoreState,
          currentConfig as StoreConfig | undefined,
        );
      }
    },
    [getData, setStoreData, storeId],
  );

  const reset = useCallback((): void => {
    resetStore(storeId);
  }, [resetStore, storeId]);

  return useMemo(
    () => ({ setData, reset, getData }),
    [setData, reset, getData],
  );
}

// ─── useDynamicStore ──────────────────────────────────────────────────────────

/**
 * Hook-based dynamic store keyed by `storeId`.
 *
 * `setData` accepts either a partial object **or** a function that receives
 * the previous state and returns a partial object — exactly like React's
 * `useState` setter.
 *
 * @example
 * ```tsx
 * const { data, setData, reset } = useDynamicStore<CounterState>('counter', {
 *   initialState: { value: 0, step: 1 },
 * });
 *
 * // object update
 * setData({ value: 42 });
 *
 * // functional update — safe for rapid successive calls
 * setData((prev) => ({ value: prev.value + prev.step }));
 * ```
 */
export function useDynamicStore<T extends StoreState, U = T>(
  storeId: string,
  config?: StoreConfig<T>,
  selector?: (state: T) => U,
): UseDynamicStoreReturn<T, U> {
  const manager = ensureManager();
  const data = manager(
    useShallow((state: DynamicStoresState) => {
      const registry = state.stores[storeId];
      const fullData = (registry?.data ?? config?.initialState ?? {}) as T;
      return selector ? selector(fullData) : (fullData as unknown as U);
    }),
  );

  const { setData, reset, getData } = useDynamicStoreMethods<T>(
    storeId,
    config,
  );

  // Initialize the store entry on first use
  useEffect(() => {
    const manager = ensureManager().getState();
    const storeRegistry = manager.stores[storeId];
    // IMPORTANT: Only set data if it doesn't exist to avoid triggering an extra re-render on mount
    if (!storeRegistry && config?.initialState !== undefined) {
      manager.setStoreData(
        storeId,
        {},
        config as StoreConfig,
      );
    }
    // Only run on mount / storeId change — intentional dep list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // Handle auto-cleanup on unmount if requested
  useEffect(() => {
    return () => {
      if (config?.resetOnUnmount === true) {
        reset();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, config?.resetOnUnmount, reset]);

  return useMemo(
    () => ({
      data,
      setData,
      reset,
      getData,
    }),
    [data, setData, reset, getData],
  ) as UseDynamicStoreReturn<T, U>;
}

// ─── Imperative helpers (outside React) ──────────────────────────────────────

/**
 * Update a dynamic store from outside a React component.
 */
export const updateDynamicStore = (
  storeId: string,
  data: StoreState,
): void => {
  ensureManager().getState().setStoreData(storeId, data);
};

/**
 * Retrieve the current state of a dynamic store from outside a React component.
 * Fallbacks to empty object if store does not exist.
 */
export const getDynamicStoreData = <T extends StoreState = StoreState>(
  storeId: string,
): T | undefined => {
  return ensureManager().getState().stores[storeId]?.data as T | undefined;
};

/**
 * Reset a single dynamic store to its initial state from outside React.
 */
export const resetDynamicStore = (storeId: string): void => {
  ensureManager().getState().resetStore(storeId);
};

/**
 * Reset dynamic stores based on the provided scope from outside React.
 */
export function resetDynamicStores(
  scope: ResetScope,
  options?: ResetOptions,
): void {
  ensureManager().getState().resetDynamicStores(scope, options);
}
