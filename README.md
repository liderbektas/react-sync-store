# lite-zustand

A tiny (**<1KB**) type-safe state store for React. Selector-based subscriptions inside components, full state access and reactive watchers outside. Zero unnecessary re-renders, no providers, no boilerplate.

```bash
npm install lite-zustand
```

---

## Why lite-zustand?

Most state management libraries are either too complex or too magical. `lite-zustand` does one thing and does it well: **gives you global state that works everywhere** — inside React components with surgical re-renders, and outside React with direct access and reactive watchers.

- **< 1KB** gzipped. No dependencies except React.
- **Zero unnecessary re-renders.** Components only re-render when selected state actually changes.
- **Works outside React.** Read, write, and watch state from anywhere — event handlers, timers, utility functions.
- **Type-safe.** Full TypeScript support with inferred types. No type casting, no `any`.
- **No boilerplate.** No providers, no context, no reducers, no actions. Just `createStore` and go.

---

## Quick Start

```ts
import { createStore } from "lite-zustand";

const useCounter = createStore({ count: 0, name: "Counter" });
```

That's it. `useCounter` is now both a **React hook** and a **store accessor**.

---

## API

### `createStore(initialState)`

Creates a new store and returns a function that acts as both a React hook and a store namespace.

```ts
const useStore = createStore({ count: 0, user: "Lider" });
```

**Returns:** A callable function with `.get()`, `.set()`, `.subscribe()`, and `.watch()` methods attached.

---

### `useStore(selector)`

Use inside React components. Subscribes to a slice of state via a selector function.

```tsx
const [value, set] = useStore((state) => state.count);
```

| Parameter  | Type               | Description                       |
| ---------- | ------------------ | --------------------------------- |
| `selector` | `(state: T) => U` | Picks the slice of state to track |

**Returns:** `[selectedValue, set]` — a tuple, just like `useState`.

> Under the hood, it uses React's `useSyncExternalStore` for concurrent mode safe subscriptions. The selector determines which part of the state your component subscribes to. When state changes, React compares the selected value — if it hasn't changed, no re-render happens.

---

### `.get()`

Returns the current state. Works anywhere.

```ts
const currentState = useStore.get();
```

---

### `.set(partial)`

Updates the state. Works anywhere. Accepts a partial object or an updater function.

```ts
// Partial update
useStore.set({ count: 5 });

// Updater function
useStore.set((state) => ({ count: state.count + 1 }));
```

State is **shallowly merged**. If you set `{ count: 5 }`, other fields remain untouched.

---

### `.subscribe(listener)`

Registers a listener that fires on every state change. Returns an unsubscribe function.

```ts
const unsubscribe = useStore.subscribe(() => {
  console.log("State changed:", useStore.get());
});

// Later...
unsubscribe();
```

---

### `.watch(selector, callback?)`

Watches a specific slice of state. The callback is **optional**.

**With callback** — fires only when the selected value changes. Gives you both the new and previous value.

```ts
useStore.watch(
  (state) => state.count,
  (next, prev) => {
    console.log(`count changed: ${prev} → ${next}`);
  }
);
```

This is different from `subscribe` — it only fires when the **selected value** changes, not on every state update.

**Without callback** — returns the current selected value as a one-time read. Useful for quick access outside React without needing `.get()` and manually picking a field.

```ts
const count = useStore.watch((state) => state.count);
console.log(count); // 0
```

---

## Full Example

A todo app that demonstrates every feature — store creation, component subscriptions with selectors, state updates, derived values, and reactive watchers outside React.

```ts
import { createStore } from "lite-zustand";

// Create store
const useTodos = createStore({
  items: [] as { id: number; text: string; done: boolean }[],
  filter: "all" as "all" | "active" | "done",
});
```

```tsx
// Each component only re-renders when its selected slice changes.
// FilterBar doesn't care about items, TodoList doesn't care about filter.

function FilterBar() {
  const [filter, set] = useTodos((state) => state.filter);

  return (
    <div>
      <button onClick={() => set({ filter: "all" })}>All</button>
      <button onClick={() => set({ filter: "active" })}>Active</button>
      <button onClick={() => set({ filter: "done" })}>Done</button>
      <p>Current: {filter}</p>
    </div>
  );
}

function TodoCount() {
  // Derived selector — only re-renders when the count actually changes
  const [doneCount] = useTodos(
    (state) => state.items.filter((t) => t.done).length
  );

  return <p>{doneCount} done</p>;
}

function TodoList() {
  const [items, set] = useTodos((state) => state.items);

  const addTodo = (text: string) => {
    set((state) => ({
      items: [...state.items, { id: Date.now(), text, done: false }],
    }));
  };

  const toggleTodo = (id: number) => {
    set((state) => ({
      items: state.items.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      ),
    }));
  };

  return (
    <div>
      <button onClick={() => addTodo("New task")}>Add</button>
      {items.map((item) => (
        <div key={item.id} onClick={() => toggleTodo(item.id)}>
          {item.done ? "✅" : "⬜"} {item.text}
        </div>
      ))}
    </div>
  );
}
```

```ts
// Outside React — no hooks needed

// Read state
const currentItems = useTodos.get().items;

// Quick read with watch (no callback)
const currentFilter = useTodos.watch((state) => state.filter);

// Write state from anywhere (API response, timer, event handler...)
useTodos.set((state) => ({
  items: [...state.items, { id: Date.now(), text: "From outside", done: false }],
}));

// React to changes — analytics, logging, persistence, side effects
useTodos.watch(
  (state) => state.items.length,
  (next, prev) => {
    console.log(`Todo count: ${prev} → ${next}`);
  }
);

// Subscribe to all changes
const unsubscribe = useTodos.subscribe(() => {
  localStorage.setItem("todos", JSON.stringify(useTodos.get()));
});
```

---

## Requirements

- React **18+** (uses `useSyncExternalStore`)
- TypeScript **4.7+** (recommended, not required)

---

## License

MIT