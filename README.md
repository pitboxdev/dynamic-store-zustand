<div align="center">

# @pitboxdev/dynamic-store-zustand

> Dynamic store factory for [Zustand](https://github.com/pmndrs/zustand) — `useState`-like ergonomics with the power of a global shared registry.

<p align="center">
  <a href="https://www.npmjs.com/package/@pitboxdev/dynamic-store-zustand">
    <img src="https://img.shields.io/npm/v/@pitboxdev/dynamic-store-zustand?style=flat-square" alt="NPM Version" />
  </a>
  <a href="https://bundlephobia.com/package/@pitboxdev/dynamic-store-zustand">
    <img src="https://img.shields.io/bundlephobia/minzip/@pitboxdev/dynamic-store-zustand?style=flat-square&label=minzipped" alt="Bundle Size" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript Strict" />
  </a>
</p>

</div>

---

## 🚀 Live Demo

- **[CodeSandbox Example](https://codesandbox.io/s/github/pitboxdev/dynamic-store-zustand/tree/main/examples/basic)** – See it in action: Theme toggling, cross-branch state updates, and complex reset scenarios.

---

## ⚡ Features

- 🛠️ **DX First:** Zero boilerplate. API mirrors `useState` ergonomics.
- 🧹 **Auto-Cleanup:** Optional store resets on navigation (with exclusions) or unmount.
- 🚀 **High Performance:** Internal shallow comparison prevents unnecessary re-renders.
- 🛡️ **100% Type-safe:** Written in TypeScript with pristine inference.
- 🪶 **Tiny:** Minimal footprint on top of your existing Zustand setup.

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install @pitboxdev/dynamic-store-zustand zustand
```

### 2. Initialization (Optional)
If you need to provide initial state or custom middlewares, initialize the manager in your entry point. Otherwise, it will be initialized automatically with defaults on first hook call.

```tsx
import { createDynamicStore } from "@pitboxdev/dynamic-store-zustand";

// Optional: Provide initial global state or custom middlewares
createDynamicStore({
  initialState: { theme: 'dark' },
  devTools: true,
  middlewares: [loggerMiddleware]
});
```

### 3. Basic Usage

```tsx
import { useDynamicStore } from "@pitboxdev/dynamic-store-zustand";

interface UserState { name: string; score: number }

function Profile() {
  const { 
    data,       // Current state (or selected part)
    setData,    // Update state (shallow merge)
    reset,      // Reset to initial state
    getData,    // Sync getter (avoids re-renders in callbacks)
  } = useDynamicStore<UserState>(
    "user",                        // 1. Store ID (must be unique)
    {                              // 2. Configuration Object
      initialState: { name: "Guest", score: 0 },
      persistOnNavigation: true,   // Keep state when changing routes
      resetOnUnmount: true,        // Reset state when component unmounts
      navigationGroups: ["auth"],  // Tag for selective bulk reset
    },
    (state) => state               // 3. Optional Selector (for performance)
  );

  return (
    <div>
      <p>{data.name}: {data.score}</p>
      <button onClick={() => setData((prev) => ({ score: prev.score + 1 }))}>
        +1 Score
      </button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

---

## 🧹 Cleanup & Navigation

By default, all dynamic stores are **reset automatically** when route change is triggered via `resetDynamicStores`.

### Config Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `persistOnNavigation` | `boolean` | `false` | If true, state is NOT reset when `resetDynamicStores("non-persistent")` is called. |
| `navigationGroups` | `string[]` | — | Tags for grouping stores. Allows for selective bulk resets (e.g., reset all "UI" stores but keep "User" stores). |
| `resetOnUnmount` | `boolean` | `false` | Automatically reset state when the component calling `useDynamicStore` is unmounted. |

### Why use `navigationGroups`?

Grouping stores is powerful for managing complex state lifetimes. Instead of resetting stores one by one, you can categorize them:

- **Example 1: The Multi-Step Form**
  Tag all stores in a checkout flow with `navigationGroups: ["checkout"]`. When the user finishes or cancels, call `resetDynamicStores(["checkout"])` to clean up everything at once.
- **Example 2: Global UI State**
  Tag modals, sidebars, and filters with `navigationGroups: ["ui"]`. You can then reset all UI elements during navigation while keeping data stores alive.

### Manual & Selective Reset

```ts
import { resetDynamicStores } from "@pitboxdev/dynamic-store-zustand";

// 1. Basic navigation cleanup:
// Resets everything EXCEPT stores with { persistOnNavigation: true }
resetDynamicStores("non-persistent"); 

// 2. The "Logout" pattern:
// Resets absolutely every dynamic store to its initial state.
resetDynamicStores("all"); 

// 3. Selective reset by Tag:
// Resets only stores that have "checkout" in their navigationGroups.
resetDynamicStores(["checkout"]); 

// 4. Reset with Exclusions:
// Resets everything but skip stores tagged with "user-settings" or "theme".
resetDynamicStores("all", { excludeGroups: ["user-settings", "theme"] });
```

---

## 🛠️ Advanced Features

### Optimizing Re-renders
Pass a selector as the third argument to subscribe only to specific state changes:

```tsx
const { data: score } = useDynamicStore("user", config, (s) => s.score);
```

### Subscriptions-free access
Use `useDynamicStoreMethods` to get setters and getters without subscribing to state changes (prevents re-renders).

```tsx
const { setData, getData } = useDynamicStoreMethods<UserState>("user");
```

### Outside React (Imperative)
```ts
import { 
  updateDynamicStore, 
  resetDynamicStore, 
  resetDynamicStores,
  getDynamicStoreData 
} from "@pitboxdev/dynamic-store-zustand";

updateDynamicStore("user", { name: "New Name" });
resetDynamicStore("user");
const currentUser = getDynamicStoreData<UserState>("user");
```

---

## 🤝 Need Professional Help?
Available for technical collaboration on React/Zustand architecture and custom project development.
Contact: [kiselevm2015@gmail.com](mailto:kiselevm2015@gmail.com)

---

## License
[MIT](./LICENSE) © Pitboxdev
