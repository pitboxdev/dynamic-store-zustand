import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useCallback, useMemo, useRef } from "react";
import type {
  SetStateAction,
  StoreConfig,
  DynamicStoreRegistry,
  StoreState,
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
  resetAllStores: () => void;
  resetNonPersistentStores: () => void;
}

const useDynamicStoresManager = create<DynamicStoresState>()(
  devtools(
    (set) => ({
      stores: {},

      setStoreData: (storeId, data, config) => {
        set((state) => {
          const existingStore = state.stores[storeId];
          const currentData: StoreState =
            existingStore?.data ?? config?.initialState ?? {};

          const entry: DynamicStoreRegistry = {
            data: { ...currentData, ...data },
            config: config ?? existingStore?.config ?? {},
            initialState:
              config?.initialState ?? existingStore?.initialState ?? {},
          };

          return {
            stores: { ...state.stores, [storeId]: entry },
          };
        });
      },

      resetStore: (storeId) => {
        set((state) => {
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

      resetAllStores: () => {
        set((state) => {
          const next: Record<string, DynamicStoreRegistry> = {};

          for (const [id, store] of Object.entries(state.stores)) {
            next[id] = { ...store, data: { ...store.initialState } };
          }

          return { stores: next };
        });
      },

      resetNonPersistentStores: () => {
        set((state) => {
          const next: Record<string, DynamicStoreRegistry> = {};

          for (const [id, store] of Object.entries(state.stores)) {
            next[id] =
              store.config.persistOnNavigation === true
                ? store
                : { ...store, data: { ...store.initialState } };
          }

          return { stores: next };
        });
      },
    }),
    { name: "DynamicStoresManager" },
  ),
);

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
  const { setStoreData, resetStore } = useDynamicStoresManager(
    useShallow((state) => ({
      setStoreData: state.setStoreData,
      resetStore: state.resetStore,
    })),
  );

  // Use ref for config to keep methods stable even if config object is unstable
  const configRef = useRef(config);
  configRef.current = config;

  const getData = useCallback((): T => {
    const storeRegistry = useDynamicStoresManager.getState().stores[storeId];
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
  const data = useDynamicStoresManager(
    useShallow((state) => {
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
    const manager = useDynamicStoresManager.getState();
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
  useDynamicStoresManager.getState().setStoreData(storeId, data);
};

/**
 * Retrieve the current state of a dynamic store from outside a React component.
 * Fallbacks to empty object if store does not exist.
 */
export const getDynamicStoreData = <T extends StoreState = StoreState>(
  storeId: string,
): T | undefined => {
  return useDynamicStoresManager.getState().stores[storeId]?.data as T | undefined;
};

/**
 * Reset a single dynamic store to its initial state from outside React.
 */
export const resetDynamicStore = (storeId: string): void => {
  useDynamicStoresManager.getState().resetStore(storeId);
};

/**
 * Reset all dynamic stores to their initial states from outside React.
 */
export const resetAllDynamicStores = (): void => {
  useDynamicStoresManager.getState().resetAllStores();
};

/**
 * Reset only stores that do not have `persistOnNavigation: true`.
 */
export const resetNonPersistentDynamicStores = (): void => {
  useDynamicStoresManager.getState().resetNonPersistentStores();
};
