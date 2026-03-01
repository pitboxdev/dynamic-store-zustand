<div align="center">

# @pitboxdev/dynamic-store-zustand

> Two complementary approaches to scalable, type-safe state management in React — both built on top of [Zustand](https://github.com/pmndrs/zustand).

<p align="center">
  <a href="https://www.npmjs.com/package/@pitboxdev/dynamic-store-zustand">
    <img src="https://img.shields.io/npm/v/@pitboxdev/dynamic-store-zustand?style=flat-square" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.com/package/@pitboxdev/dynamic-store-zustand">
    <img src="https://img.shields.io/npm/dw/@pitboxdev/dynamic-store-zustand?style=flat-square" alt="NPM Downloads" />
  </a>
  <a href="https://bundlephobia.com/package/@pitboxdev/dynamic-store-zustand">
    <img src="https://img.shields.io/bundlephobia/minzip/@pitboxdev/dynamic-store-zustand?style=flat-square&label=minzipped" alt="Bundle Size" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript Strict" />
  </a>
  <a href="https://www.npmjs.com/package/@pitboxdev/dynamic-store-zustand">
    <img src="https://img.shields.io/npm/l/@pitboxdev/dynamic-store-zustand?style=flat-square" alt="License MIT" />
  </a>
</p>

</div>

---

## Features

- ✨ **Zero Boilerplate:** No more complex setups or switch-statements.
- 🧹 **Auto-Cleanup:** Built-in hooks for automatic store resets on unmount.
- 🔄 **Functional Updaters:** Handles race conditions naturally with `setData(prev => ...)`.
- 🛡️ **Fully Typed:** Inferred TypeScript definitions out of the box with strict mode support.
- 🪶 **Tiny Footprint:** Minimal addition to your bundle size.

---

## Table of Contents

- [Features](#features)
- [Overview](#overview)
- [Installation](#installation)
- [API 1 — `createDynamicStore`](#api-1--createdynamicstore)
  - [Quick Start](#quick-start)
  - [Outside React](#outside-react)
  - [TypeScript](#typescript)
- [API 2 — `useDynamicStore`](#api-2--usedynamicstore)
  - [Quick Start](#quick-start-1)
  - [Functional updater (`setData`)](#functional-updater-setdata)
  - [Auto-cleanup with `useDynamicStoreWithCleanup`](#auto-cleanup-with-usedynamicstorewithcleanup)
  - [Imperative helpers (outside React)](#imperative-helpers-outside-react)
  - [Config options](#config-options)
  - [TypeScript](#typescript-1)
- [When to use which API](#when-to-use-which-api)
- [Full API Reference](#full-api-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The package ships **two independent APIs** that can be used separately or together:

| | `createDynamicStore` | `useDynamicStore` |
|---|---|---|
| Style | Factory function | React hook |
| Stores | One Zustand store per call | All stores live in a single registry |
| Actions | Explicit, typed | Implicit via `setData` |
| Functional updater | Via `set((s) => …)` in actions | Built-in `setData((prev) => …)` |
| Auto-cleanup | — | `useDynamicStoreWithCleanup` |
| Navigation persistence | — | `persistOnNavigation` config flag |
| Best for | Permanent, feature-level stores | Page/form/modal scoped state |

---

## Installation

```bash
npm install @pitboxdev/dynamic-store-zustand zustand
# or
yarn add @pitboxdev/dynamic-store-zustand zustand
# or
pnpm add @pitboxdev/dynamic-store-zustand zustand
```

> **Peer dependencies:** `react >= 18` and `zustand >= 5` must be installed in your project.

---

## API 1 — `createDynamicStore`

A factory function that creates a standalone, fully typed Zustand store from a configuration object with explicit actions.

### Quick Start

```tsx
import { createDynamicStore } from "@pitboxdev/dynamic-store-zustand";

const { useStore } = createDynamicStore({
  initialState: { count: 0 },
  actions: (set) => ({
    increment: () => set((s) => ({ count: s.count + 1 })),
    decrement: () => set((s) => ({ count: s.count - 1 })),
    reset: () => set({ count: 0 }),
  }),
});

function Counter() {
  const count = useStore((s) => s.count);
  const { increment, decrement, reset } = useStore();

  return (
    <div>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Outside React

```ts
const { store } = createDynamicStore({ initialState: { count: 0 }, actions: (set) => ({
  increment: () => set((s) => ({ count: s.count + 1 })),
}) });

// Read
const count = store.getState().count;

// Write
store.setState({ count: 42 });

// Subscribe
const unsub = store.subscribe((state) => console.log(state.count));
unsub();
```

### TypeScript

All types are inferred automatically. You can also define them explicitly:

```ts
import {
  createDynamicStore,
  type DynamicStoreConfig,
} from "@pitboxdev/dynamic-store-zustand";

interface CounterState { count: number }
interface CounterActions {
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const config: DynamicStoreConfig<CounterState, CounterActions> = {
  initialState: { count: 0 },
  actions: (set) => ({
    increment: () => set((s) => ({ count: s.count + 1 })),
    decrement: () => set((s) => ({ count: s.count - 1 })),
    reset: () => set({ count: 0 }),
  }),
};

const { useStore, store } = createDynamicStore(config);
```

Using multiple selectors with shallow equality:

```ts
import { useShallow } from "zustand/react/shallow";

const { count, increment } = useStore(
  useShallow((s) => ({ count: s.count, increment: s.increment }))
);
```

---

## API 2 — `useDynamicStore`

A hook that stores state in a single shared registry keyed by a string `storeId`. `setData` works exactly like React's `useState` setter — it accepts either a partial object or a function that receives the previous state.

### Quick Start

```tsx
import { useDynamicStore } from "@pitboxdev/dynamic-store-zustand";

interface CounterState {
  value: number;
  step: number;
}

const initial: CounterState = { value: 0, step: 1 };

function Counter() {
  const { data, setData, reset } = useDynamicStore<CounterState>("counter", {
    initialState: initial,
  });

  return (
    <div>
      <p>Count: {data.value}</p>

      {/* Object update */}
      <button onClick={() => setData({ value: data.value + data.step })}>
        + (simple)
      </button>

      {/* Functional update — always reads the latest state */}
      <button onClick={() => setData((prev) => ({ value: prev.value + prev.step }))}>
        + (functional)
      </button>

      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Functional updater (`setData`)

`setData` accepts two forms:

```ts
// 1. Partial object — merges into current state
setData({ value: 42 });

// 2. Updater function — receives the latest state, returns a partial update
setData((prev) => ({ value: prev.value + 1 }));
```

**Why use the functional form?**

Without it, rapid successive calls all see the same snapshot:

```ts
// ❌ race condition — both calls read the same stale value
setData({ value: data.value + 1 });
setData({ value: data.value + 1 }); // data.value is still the old value

// ✅ functional — each call receives the result of the previous one
setData((prev) => ({ value: prev.value + 1 }));
setData((prev) => ({ value: prev.value + 1 }));
```

Always prefer the functional form when the new state depends on the old state.

#### Todo list example

```tsx
interface Todo { id: string; text: string; done: boolean }
interface TodosState { items: Todo[]; filter: "all" | "active" | "done" }

function TodoList() {
  const { data, setData } = useDynamicStore<TodosState>("todos", {
    initialState: { items: [], filter: "all" },
  });

  const addTodo = (text: string) => {
    setData((prev) => ({
      items: [...prev.items, { id: Date.now().toString(), text, done: false }],
    }));
  };

  const toggle = (id: string) => {
    setData((prev) => ({
      items: prev.items.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      ),
    }));
  };

  const clearDone = () => {
    setData((prev) => ({
      items: prev.items.filter((t) => !t.done),
      filter: "all",
    }));
  };

  // ...
}
```

#### Shopping cart example

```tsx
interface CartItem { id: string; name: string; price: number; quantity: number }
interface CartState { items: CartItem[]; discount: number }

function Cart() {
  const { data, setData } = useDynamicStore<CartState>("cart", {
    initialState: { items: [], discount: 0 },
    persistOnNavigation: true,
  });

  const addItem = (product: Omit<CartItem, "quantity">) => {
    setData((prev) => {
      const exists = prev.items.find((i) => i.id === product.id);
      return {
        items: exists
          ? prev.items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [...prev.items, { ...product, quantity: 1 }],
      };
    });
  };

  const total = data.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  ) * (1 - data.discount / 100);

  // ...
}
```

### Auto-cleanup with `useDynamicStoreWithCleanup`

`useDynamicStoreWithCleanup` works identically to `useDynamicStore` but resets the store when the component unmounts — useful for modal dialogs, wizard steps, or edit forms.

```tsx
import { useDynamicStoreWithCleanup } from "@pitboxdev/dynamic-store-zustand";

function EditModal() {
  const { data, setData } = useDynamicStoreWithCleanup<FormState>(
    "editForm",
    { initialState: { name: "", email: "" }, resetOnUnmount: true }
  );

  // State is automatically reset when the modal closes
}
```

### Imperative helpers (outside React)

All helpers call into the shared manager directly — no hook required.

```ts
import {
  updateDynamicStore,
  resetDynamicStore,
  resetAllDynamicStores,
  resetNonPersistentDynamicStores,
} from "@pitboxdev/dynamic-store-zustand";

// Merge data into a store
updateDynamicStore("cart", { discount: 20 });

// Reset one store to its initial state
resetDynamicStore("editForm");

// Reset every store
resetAllDynamicStores();

// Reset only stores without persistOnNavigation: true (e.g. on route change)
resetNonPersistentDynamicStores();
```

### Config options

| Option | Type | Default | Description |
|---|---|---|---|
| `initialState` | `T` | `{}` | Initial values; also used when `reset()` is called |
| `persistOnNavigation` | `boolean` | `false` | Skip reset when `resetNonPersistentDynamicStores()` is called |
| `resetOnUnmount` | `boolean` | `false` | Auto-reset when the component unmounts (`useDynamicStoreWithCleanup` only) |

### TypeScript

```ts
import {
  useDynamicStore,
  type StoreConfig,
  type SetStateAction,
  type UseDynamicStoreReturn,
} from "@pitboxdev/dynamic-store-zustand";

interface FormState {
  firstName: string;
  lastName: string;
  age: number;
  agreed: boolean;
}

const config: StoreConfig<FormState> = {
  initialState: { firstName: "", lastName: "", age: 0, agreed: false },
  resetOnUnmount: true,
};

function RegistrationForm() {
  const { data, setData, reset }: UseDynamicStoreReturn<FormState> =
    useDynamicStore<FormState>("regForm", config);

  // TypeScript will error on unknown keys:
  // setData({ unknown: true }); ❌

  const setAge = (age: number) => {
    setData((prev) => ({
      age,
      // Clear consent when user is under 18
      agreed: age < 18 ? false : prev.agreed,
    }));
  };

  // ...
}
```

---

## When to use which API

### Use `createDynamicStore` when you need:

- A **permanent, feature-level store** (auth, theme, user profile, global UI)
- **Explicit, named actions** that encapsulate business logic
- **Fine-grained selectors** and subscriptions outside React
- The full Zustand API (middleware, persist, devtools, subscribe)

```ts
// auth.store.ts
export const { useStore: useAuthStore, store: authStore } = createDynamicStore({
  initialState: { user: null as User | null, token: "" },
  actions: (set) => ({
    login: (user: User, token: string) => set({ user, token }),
    logout: () => set({ user: null, token: "" }),
  }),
});
```

### Use `useDynamicStore` when you need:

- **Page / route / modal scoped state** with optional auto-cleanup
- **useState-like ergonomics** without boilerplate action definitions
- **Multiple stores** managed centrally with shared reset helpers
- Quick iteration when action interfaces aren't stable yet

```tsx
// Inside a wizard step component
const { data, setData } = useDynamicStoreWithCleanup<StepState>(
  "wizard-step-2",
  { initialState: { selection: null }, resetOnUnmount: true }
);
```

---

## Full API Reference

### `createDynamicStore(config)`

| Parameter | Type | Description |
|---|---|---|
| `config.initialState` | `TState` | Plain object representing the initial state |
| `config.actions` | `(set, get) => TActions` | Factory that returns named action implementations |

Returns `{ useStore, store }`.

---

### `useDynamicStore<T>(storeId, config?)`

| Parameter | Type | Description |
|---|---|---|
| `storeId` | `string` | Unique key identifying this store in the registry |
| `config` | `StoreConfig<T>` | Optional config (see [Config options](#config-options)) |

Returns `{ data: T, setData, reset }`.

---

### `useDynamicStoreWithCleanup<T>(storeId, config?)`

Same signature as `useDynamicStore`. Calls `reset()` on component unmount when `config.resetOnUnmount` is `true`.

---

### Imperative helpers

| Function | Signature | Description |
|---|---|---|
| `updateDynamicStore` | `(storeId, data) => void` | Merge data into a store from outside React |
| `resetDynamicStore` | `(storeId) => void` | Reset one store to its `initialState` |
| `resetAllDynamicStores` | `() => void` | Reset every registered store |
| `resetNonPersistentDynamicStores` | `() => void` | Reset stores where `persistOnNavigation` is not `true` |

---

### Exported types

| Type | Description |
|---|---|
| `StoreState` | `Record<string, unknown>` — base constraint for state objects |
| `StoreActions` | `Record<string, (...args) => unknown>` — base constraint for action maps |
| `DynamicStoreConfig<TState, TActions>` | Config type for `createDynamicStore` |
| `DynamicStore<TState, TActions>` | Return type of `createDynamicStore` |
| `StoreSlice<TState, TActions>` | Merged state + actions type |
| `StoreConfig<T>` | Config type for `useDynamicStore` |
| `SetStateAction<T>` | `Partial<T> \| ((prev: T) => Partial<T>)` — setter argument type |
| `DynamicStoreRegistry` | Internal registry entry (advanced use) |
| `UseDynamicStoreReturn<T>` | Return type of `useDynamicStore` |

---

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/pitboxdev/dynamic-store-zustand/issues).

---

## License

[MIT](./LICENSE) © Pitboxdev
