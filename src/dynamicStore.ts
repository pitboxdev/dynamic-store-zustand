import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useEffect } from "react";
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

export interface UseDynamicStoreReturn<T extends StoreState> {
  data: T;
  setData: (updater: SetStateAction<T>) => void;
  reset: () => void;
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
export function useDynamicStore<T extends StoreState>(
  storeId: string,
  config?: StoreConfig<T>,
): UseDynamicStoreReturn<T> {
  const storesManager = useDynamicStoresManager();
  const storeRegistry = storesManager.stores[storeId];

  // Initialize the store entry on first use
  useEffect(() => {
    if (!storeRegistry && config?.initialState !== undefined) {
      storesManager.setStoreData(storeId, {}, config as StoreConfig);
    }
    // Only run on mount / storeId change — intentional dep list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const data = (storeRegistry?.data ?? config?.initialState ?? {}) as T;

  const setData = (updater: SetStateAction<T>): void => {
    if (typeof updater === "function") {
      const currentData = (
        storesManager.stores[storeId]?.data ?? config?.initialState ?? {}
      ) as T;
      const updates = updater(currentData);
      storesManager.setStoreData(
        storeId,
        updates as StoreState,
        config as StoreConfig | undefined,
      );
    } else {
      storesManager.setStoreData(
        storeId,
        updater as StoreState,
        config as StoreConfig | undefined,
      );
    }
  };

  const reset = (): void => {
    storesManager.resetStore(storeId);
  };

  return { data, setData, reset };
}

// ─── useDynamicStoreWithCleanup ───────────────────────────────────────────────

/**
 * Same as `useDynamicStore` but automatically resets state when the
 * component unmounts (when `config.resetOnUnmount` is `true`).
 *
 * @example
 * ```tsx
 * const { data, setData, reset } = useDynamicStoreWithCleanup<FormState>(
 *   'editForm',
 *   { initialState, resetOnUnmount: true },
 * );
 * ```
 */
export function useDynamicStoreWithCleanup<T extends StoreState>(
  storeId: string,
  config?: StoreConfig<T>,
): UseDynamicStoreReturn<T> {
  const { data, setData, reset } = useDynamicStore<T>(storeId, config);

  useEffect(() => {
    return () => {
      if (config?.resetOnUnmount === true) {
        reset();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, config?.resetOnUnmount]);

  return { data, setData, reset };
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
