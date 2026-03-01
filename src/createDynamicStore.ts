import { create } from "zustand";
import type {
  DynamicStore,
  DynamicStoreConfig,
  StoreActions,
  StoreState,
  StoreSlice,
} from "./types";

/**
 * Creates a dynamic Zustand store from a configuration object.
 *
 * @example
 * ```ts
 * const { useStore } = createDynamicStore({
 *   initialState: { count: 0 },
 *   actions: (set) => ({
 *     increment: () => set((s) => ({ count: s.count + 1 })),
 *     decrement: () => set((s) => ({ count: s.count - 1 })),
 *     reset: () => set({ count: 0 }),
 *   }),
 * });
 * ```
 */
export function createDynamicStore<
  TState extends StoreState,
  TActions extends StoreActions,
>(
  config: DynamicStoreConfig<TState, TActions>,
): DynamicStore<TState, TActions> {
  const { initialState, actions } = config;

  const store = create<StoreSlice<TState, TActions>>()((set, get) => ({
    ...initialState,
    ...actions(set, get),
  }));

  return {
    useStore: store,
    store,
  };
}
