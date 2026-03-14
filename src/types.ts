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
  /** Groups this store belongs to for selective reset. */
  navigationGroups?: string[];
  /** Automatically reset state when the component unmounts. */
  resetOnUnmount?: boolean;
  /** Initial state values used on first mount and on reset. */
  initialState?: T;
}

/** Configuration for resetting dynamic stores. */
export interface ResetOptions {
  /** Groups to ignore during reset (even if they would otherwise be reset). */
  excludeGroups?: string[];
}

/** Configuration for creating the global dynamic manager. */
export interface DynamicStoreConfig {
  /** 
   * Initial state of the global manager (can contain static data).
   */
  initialState?: Record<string, any>;
  /**
   * Whether to enable Zustand DevTools. Default: true.
   */
  devTools?: boolean | any;
  /**
   * Extra Zustand middlewares to apply to the manager store.
   */
  middlewares?: any[];
}

/** Scope for resetting dynamic stores. */
export type ResetScope = "all" | "non-persistent" | string[];

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
