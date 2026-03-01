import type { StoreApi, UseBoundStore } from "zustand";

// ─── useDynamicStore types ────────────────────────────────────────────────────

/**
 * Updater argument for setData — either a partial object or a function
 * that receives the previous state and returns a partial object.
 * Mirrors the React useState updater pattern.
 */
export type SetStateAction<T> =
  | Partial<T>
  | ((prevState: T) => Partial<T>);

/**
 * Configuration options for useDynamicStore / useDynamicStoreWithCleanup.
 */
export interface StoreConfig<
  T extends StoreState = StoreState,
> {
  /** Keep state alive across navigation (not reset on resetNonPersistentStores). */
  persistOnNavigation?: boolean;
  /** Automatically reset state when the component unmounts. */
  resetOnUnmount?: boolean;
  /** Initial state values used on first mount and on reset. */
  initialState?: T;
}

/**
 * Internal registry entry stored per storeId in the manager.
 */
export interface DynamicStoreRegistry {
  data: StoreState;
  config: StoreConfig;
  initialState: StoreState;
}

/**
 * A plain object that can serve as store state.
 * Keys are strings, values can be anything.
 */
export type StoreState = Record<string, unknown>;
