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

## ⚡ Features

- 🛠️ **DX First (Zero Boilerplate):** Extremely simple API without boilerplate, keeping the standard React `useState` ergonomics.
- 🧹 **Auto-Cleanup:** Built-in config flag `resetOnUnmount` for automatic store resets on unmount.
- ⚡ **High Performance:** Subscription-free hooks available (`useDynamicStoreMethods`) to read and update state without component re-renders.
- 🔄 **Functional Updaters:** Handles race conditions naturally with `setData(prev => ...)`.
- 🛡️ **100% Type-safe:** Written in TypeScript with pristine type inference and autocomplete out of the box.
- 🚀 **Performance Optimized:** Internal `shallow` comparison prevents unnecessary re-renders when using selectors or initializing stores.
- 🪶 **Tiny Footprint:** Minimal addition to your bundle size.

---

## ❓ Motivation

Modern frontend applications often suffer from state management boilerplate and bloated global stores. Setting up stores usually requires defining schemas upfront, creating actions, and wiring things together.

The main motivation behind this package is to **drastically reduce boilerplate and simplify store management for maximum efficiency**.

Whether you need to generate stores dynamically on the fly or just want the simplicity of `useState` with the power of a scalable global store, this API delivers a seamless, hassle-free experience.

---

## Table of Contents

- [⚡ Features](#-features)
- [❓ Motivation](#-motivation)
- [Overview](#overview)
- [Installation](#installation)
- [`useDynamicStore`](#usedynamicstore)
  - [Quick Start](#quick-start)
  - [Functional updater (`setData`)](#functional-updater-setdata)
  - [Examples](#examples)
- [`useDynamicStoreMethods` (No Subscription)](#usedynamicstoremethods-no-subscription)
- [Imperative helpers (outside React)](#imperative-helpers-outside-react)
- [Config options](#config-options)
- [TypeScript](#typescript)
- [Full API Reference](#full-api-reference)
- [Contributing](#contributing)
- [🛠️ Professional Services](#️-professional-services)
- [License](#license)

---

## Overview

`@pitboxdev/dynamic-store-zustand` provides dynamic store management for React applications. It is built on top of [Zustand](https://github.com/pmndrs/zustand) and exposes a hook API that feels exactly like React's `useState`, with the addition that stores are stored globally in a single shared registry keyed by a string `storeId`.

| Feature                    | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| **Dynamic initialization** | Stores are initialized just-in-time when the hook mounts        |
| **useState-like API**      | `setData(obj)` or `setData((prev) => update)`                   |
| **Auto-cleanup**           | `resetOnUnmount: true` resets state on unmount                  |
| **Navigation reset**       | Non-persistent stores reset via imperative API on route changes |
| **Imperative helpers**     | Modify and reset stores outside React components                |

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

## `useDynamicStore`

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
  const { data, setData, reset, getData } = useDynamicStore<CounterState>(
    "counter",
    {
      initialState: initial,
    },
  );

  return (
    <div>
      <p>Count: {data.value}</p>

      {/* Object update */}
      <button onClick={() => setData({ value: data.value + data.step })}>
        + (simple)
      </button>

      {/* Functional update — always reads the latest state */}
      <button
        onClick={() => setData((prev) => ({ value: prev.value + prev.step }))}
      >
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

### Using Selectors for Performance

By default, a component reading `data` relies on the full object update. To avoid unnecessary re-renders when only a specific part of a store changes, you can pass an optional selector as the third argument.

`@pitboxdev/dynamic-store-zustand` automatically applies **shallow comparison** to the selector's result, so the component only re-renders if the selected data actually changes:

```tsx
// This component will ONLY re-render when `user.name` changes,
// even if `user.score` or other fields are updated.
const { data: name } = useDynamicStore("user", config, (state) => state.name);
```

### Examples

#### Todo list example

```tsx
interface Todo {
  id: string;
  text: string;
  done: boolean;
}
interface TodosState {
  items: Todo[];
  filter: "all" | "active" | "done";
}

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
      items: prev.items.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
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
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
interface CartState {
  items: CartItem[];
  discount: number;
}

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
              i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
            )
          : [...prev.items, { ...product, quantity: 1 }],
      };
    });
  };

  const total =
    data.items.reduce((sum, i) => sum + i.price * i.quantity, 0) *
    (1 - data.discount / 100);

  // ...
}
```

---

## `useDynamicStoreMethods` (No Subscription)

If you need to update or read the store **without subscribing to its changes** (to avoid component re-renders), you can use `useDynamicStoreMethods`:

```tsx
import { useDynamicStoreMethods } from "@pitboxdev/dynamic-store-zustand";

function Controls() {
  // This component will NOT re-render when 'counter' state changes!
  const { setData, reset, getData } =
    useDynamicStoreMethods<CounterState>("counter");

  const increment = () => {
    // Both forms work just like in the regular hook:
    setData((prev) => ({ value: prev.value + 1 }));
  };

  const logCurrent = () => {
    console.log("Current state:", getData()); // Get current state without subscribing
  };

  return (
    <div>
      <button onClick={increment}>Increment</button>
      <button onClick={logCurrent}>Log State</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

---

## Imperative helpers (outside React)

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

---

## Config options

| Option                | Type      | Default | Description                                                                |
| --------------------- | --------- | ------- | -------------------------------------------------------------------------- |
| `initialState`        | `T`       | `{}`    | Initial values; also used when `reset()` is called                         |
| `persistOnNavigation` | `boolean` | `false` | Skip reset when `resetNonPersistentDynamicStores()` is called              |
| `resetOnUnmount`      | `boolean` | `false` | Auto-reset when the component unmounts (`useDynamicStoreWithCleanup` only) |

---

## TypeScript

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

## Full API Reference

### `useDynamicStore<T, U = T>(storeId, config?, selector?)`

| Parameter  | Type              | Description                                                                               |
| ---------- | ----------------- | ----------------------------------------------------------------------------------------- |
| `storeId`  | `string`          | Unique key identifying this store in the registry                                         |
| `config`   | `StoreConfig<T>`  | Optional config (see [Config options](#config-options))                                   |
| `selector` | `(state: T) => U` | Optional function to subscribe to a specific sub-state and prevent unnecessary re-renders |

Returns `{ data: T, setData, reset, getData }`.

---

### `useDynamicStoreMethods<T>(storeId, config?)`

Returns `{ setData, reset, getData }` bound to the store, without subscribing the component to state changes.

---

### Imperative helpers

| Function                          | Signature                     | Description                                            |
| --------------------------------- | ----------------------------- | ------------------------------------------------------ |
| `updateDynamicStore`              | `(storeId, data) => void`     | Merge data into a store from outside React             |
| `getDynamicStoreData`             | `(storeId) => T \| undefined` | Retrieve a store's current state from outside React    |
| `resetDynamicStore`               | `(storeId) => void`           | Reset one store to its `initialState`                  |
| `resetAllDynamicStores`           | `() => void`                  | Reset every registered store                           |
| `resetNonPersistentDynamicStores` | `() => void`                  | Reset stores where `persistOnNavigation` is not `true` |

---

### Exported types

| Type                              | Description                                                      |
| --------------------------------- | ---------------------------------------------------------------- |
| `StoreState`                      | `Record<string, unknown>` — base constraint for state objects    |
| `StoreConfig<T>`                  | Config type for `useDynamicStore`                                |
| `SetStateAction<T>`               | `Partial<T> \| ((prev: T) => Partial<T>)` — setter argument type |
| `DynamicStoreRegistry`            | Internal registry entry (advanced use)                           |
| `UseDynamicStoreReturn<T>`        | Return type of `useDynamicStore`                                 |
| `UseDynamicStoreMethodsReturn<T>` | Return type of `useDynamicStoreMethods`                          |

---

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/pitboxdev/dynamic-store-zustand/issues).

---

## 🛠️ Professional Services

Need help with your React/Zustand state architecture? Whether you're looking to integrate this library into a large-scale application, build a complex project from scratch, or require specific feature development, I'm available for hands-on technical collaboration.

- 🏗️ **Custom Project Development:** Building complex React/TypeScript applications from the ground up with scalable architecture.
- ⚙️ **Integration & Migration:** Seamlessly implementing `@pitboxdev/dynamic-store-zustand` into your existing codebase or migrating legacy state solutions.
- 🛠️ **Feature Development:** Implementing tailored features, refactoring state logic, and optimizing performance for your specific needs.

Contact me: [kiselevm2015@gmail.com](mailto:kiselevm2015@gmail.com)

---

## License

[MIT](./LICENSE) © Pitboxdev
