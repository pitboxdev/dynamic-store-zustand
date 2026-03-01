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

// ─── createDynamicStore types ─────────────────────────────────────────────────


/**
 * A plain object that can serve as store state.
 * Keys are strings, values can be anything.
 */
export type StoreState = Record<string, unknown>;

/**
 * Actions are functions attached to the store.
 */
export type StoreActions = Record<string, (...args: unknown[]) => unknown>;

/**
 * Full store slice = state + actions.
 */
export type StoreSlice<
  TState extends StoreState = StoreState,
  TActions extends StoreActions = StoreActions,
> = TState & TActions;

/**
 * Configuration object passed to createDynamicStore.
 */
export interface DynamicStoreConfig<
  TState extends StoreState,
  TActions extends StoreActions,
> {
  /** Initial state values */
  initialState: TState;
  /** Factory that receives `set` and `get` and returns action implementations */
  actions: (
    set: StoreApi<StoreSlice<TState, TActions>>["setState"],
    get: StoreApi<StoreSlice<TState, TActions>>["getState"],
  ) => TActions;
}

/**
 * The return type of createDynamicStore.
 */
export interface DynamicStore<
  TState extends StoreState,
  TActions extends StoreActions,
> {
  /** Zustand React hook */
  useStore: UseBoundStore<StoreApi<StoreSlice<TState, TActions>>>;
  /** Direct access to the underlying Zustand store API */
  store: StoreApi<StoreSlice<TState, TActions>>;
}
