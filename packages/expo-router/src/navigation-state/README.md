# `navigation-state` — Router v57 state model

A greenfield navigation state layer for expo-router, opt-in behind **`enableNewStateModel()`**. The
navigation tree becomes the single source of truth in a React-owned reducer; react-navigation and the
native views are demoted to a **render target**. When the flag is off, none of this runs and the
existing react-navigation-owned path is byte-identical.

Design rationale and the full decision log live at the repo root: **`RFC.md`** (the spec),
**`Decisions.md`** (P-1…P-15 state core, R-1…R-12 render layer), **`Plan.md`** / **`Plan-render.md`**.

## The model in one paragraph

State is a **homogeneous tree**: every navigator level is a `NavNode = { key, routes, index }`, and a
route may host a nested navigator via `child`. There is **no `type` field** — whether a node renders
as a stack or tabs, and what an action means against it, is decided by a **behavior** looked up by
name. A **dumb, pure reducer** applies primitive ops (`insert` / `remove` / `setIndex`); all
intent→ops semantics live in a separate **resolution** layer so the reducer stays trivial and global
resolution works even for un-mounted branches.

## Two layers

```
navigation-state/            ← CORE: pure state + resolution + the store (no rendering)
└── render/                  ← RENDER: turns a NavNode slice into real screens via the existing RN views
```

## Core files (`navigation-state/`)

| File | Role |
|------|------|
| `types.ts` | The vocabulary: `NavNode` / `RouteEntry` / `GlobalNavState` (the tree), `PrimitiveOp` (reducer ops), `NodeIntent` (per-node intents), `BehaviorName` / `BehaviorLookup` / `BehaviorStrategy`. |
| `reducer.ts` | The **dumb, pure, synchronous reducer**. `reduce(state, { ops, source })` applies primitive ops, rebuilding only the touched spine (untouched subtrees keep identity). Dedupes `insert` by key, treats `remove` of an absent key as identity, keeps `index` in bounds. Ignores `source`. |
| `behaviors.ts` | The **resolution seam**: `resolve(intent, node, behavior)` switches over `stack`/`tabs` strategies to turn a node-local intent (`push`/`goBack`/`popTo`/`popToTop`/`focus`) into primitive ops. Render-free — works on a node that isn't mounted. |
| `keys.ts` | `createRouteKey(name)` — the **single key-minting authority** so hydration and runtime mint comparable keys (a JS push and its native echo dedupe). |
| `tree.ts` | `focusedChain(root)` — the chain of nodes from root to the focused leaf (each tagged with the name used for behavior lookup; root = `ROOT_NAME`). Used by back-bubbling and resolution. |
| `hydration.ts` | URL → tree. `treeFromNavigationState(...)` converts react-navigation's nested `PartialState` into the homogeneous tree; `hydrate(path, options)` reuses the static, config-derived `getStateFromPath`. |
| `projection.ts` | Tree → URL. `navigationStateFromTree(tree)` is the inverse converter; `project(tree, options)` reuses `getPathFromState`, following `index` to the focused path. |
| `actions.ts` | `resolveNavigate(current, target, lookup)` — forward navigation: diffs a hydrated target against current state along the target's focused path, promoting/pushing absent routes and focusing present ones. |
| `back.ts` | `resolveBack(state, lookup, focusOrder?)` — render-free back bubbling from the focused leaf up; returns `{ ops }` if a node handles it, else `{ exit: true }` (for the Android `BackHandler`). |
| `store.tsx` | The **root store + imperative bridge**. `NavigationStateProvider` (one root `useReducer`, context-distributed), `useNavigationTree` / `useOptionalNavigationTree` (render reads), and the module bridge for reads/writes outside render: `dispatchNav` (wrapped in `startTransition`) and `getNavSnapshot` (committed snapshot). |
| `enable.ts` | The flag: `enableNewStateModel()` / `isNewStateModelEnabled()` (read at render / per-dispatch, never module-eval) + a test-only reset. |
| `behaviorMap.ts` | Runtime `name → behavior` registry. Navigators call `registerBehavior` at mount; the resolvers read `getBehaviorLookup()`. (Stand-in for a future static manifest.) |
| `integrate.ts` | The **glue the flag seams call**, so each touch-point in the shared code stays a one-line branch: `getInitialAppTree` / `hydrateAppTree` (build the app tree, unwrapping the synthetic `__root` slot), `imperativeDispatch` (router queue → resolve → `dispatchNav`), `projectRouteInfo` (tree → `UrlObject`), `handleHardwareBack`. |

## Render files (`navigation-state/render/`)

The render layer treats navigators as pure render targets (RFC D3/D5). It does **not** use
react-navigation's `useNavigationBuilder` (the reducer owns state); instead it projects a `NavNode`
slice into the shape the **existing** views consume and supplies a `navigation` shim.

| File | Role |
|------|------|
| `navNodeContext.tsx` | `NavNodeProvider` / `useNavNodeSlice` — hands each navigator its `NavNode` slice. A parent provides a route's `child` to the nested navigator → this is the **recursion seam**. Slices are reference-stable, so navigators can memoize on them. |
| `projectToStackState.ts` | Projects a `NavNode` into the inert `StackNavigationState` shape `NativeStackView` / `ExperimentalStackView` read (one-way; never fed back to a builder). Route keys pass through unchanged. |
| `navigationShim.ts` | `createStackNavigationShim` — a **partial react-navigation `navigation` object** (the small surface `BaseRoute` + the views actually call: `isFocused`/`getState`/`addListener`/`replaceParams`/`dispatch`). Routes writes through the behavior seam → `dispatchNav` (native-origin actions tagged `source:'native'`). |
| `emitter.ts` | `createEmitter` — a minimal per-navigator event bus for the shim's `addListener`/`emit`. |
| `createStackNavigator.tsx` | `createTreeStackNavigator(View)` + `Stack`. Reads the slice, builds descriptors (screens via expo-router's own `getQualifiedRouteComponent`, recursion via `NavNodeProvider`), wraps the view in the contexts `useNavigationBuilder`'s `NavigationContent` normally supplies (Theme / Helpers / StateListener / FocusedRouteKey / PreventRemove), and renders it. `ExperimentalStack` reuses this factory with a different view. |
| `createNativeTabsNavigator.tsx` | `NativeTabs`. Declared `<NativeTabs.Trigger>`s drive the bar (mount-all, P-10); the tree holds promoted tabs; a not-yet-visited tab renders a default node. Switching resolves a tabs `focus` (set-index if promoted, else insert+set-index). Reuses the existing `NativeTabsView`. |
| `NewStateModelRoot.tsx` | The **app root under the flag**. Mounts `NavigationStateProvider` with the hydrated tree, renders the app's root layout (which renders the new `<Stack/>`/`<NativeTabs/>`), drains the imperative router queue, and subscribes Android hardware-back. |

## How it fits together

### 1. Boot (flag on)

```
ExpoRoot (isNewStateModelEnabled?)
  └─ integrate.getInitialAppTree()            // store.state → treeFromNavigationState → unwrap __root
       └─ NewStateModelRoot
            └─ store.NavigationStateProvider(initial)         // root useReducer + bridge install
                 └─ NavNodeProvider(tree.root)
                      └─ store.rootComponent  (app _layout)   // via getQualifiedRouteComponent
                           └─ <Stack/> | <NativeTabs/>        // reads its slice, renders real screens
```

### 2. Navigate (`router.push('/a/b')`)

```
router.push → routingQueue → run() (flag) → integrate.imperativeDispatch
  ├─ hydrateAppTree('/a/b')                   // target tree (reuses getStateFromPath)
  ├─ actions.resolveNavigate(snapshot, target, behaviorMap)   // → primitive ops
  └─ store.dispatchNav({ ops, source:'js' })  → reducer.reduce → context updates → navigators re-render
```

Within a navigator (a native pop / gesture / tab tap) the flow is the same, entered from the view via
the `navigation` shim → `behaviors.resolve` → `dispatchNav`.

### 3. Reads & back

```
useRouteInfo (flag)  → integrate.projectRouteInfo(tree) → getRouteInfoFromState → UrlObject  (usePathname etc.)
BackHandler / router.back → back.resolveBack(snapshot, behaviorMap) → dispatchNav  |  return false → exit
```

### The dependency shape

- `render/*` depends on the core (`store`, `behaviors`, `reducer`, `keys`, `projection`, `behaviorMap`)
  and on the existing expo-router views/screens — never the reverse.
- `integrate.ts` is the only core file that imports back into the legacy `global-state`/`fork` (to reuse
  `getStateFromPath` / `getPathFromState` / `getRouteInfoFromState` and the `store` linking config).
- `enable.ts` is imported by the shared files (`ExpoRoot`, `routingQueue`, `useRouteInfo`, `store`,
  `StackClient`, `NativeTabs`, `experimental-stack`) to gate every seam; nothing imports it at
  module-eval for branching.

## Status & known limits

All three navigators (Stack, ExperimentalStack, NativeTabs) render and navigate from the tree,
jest-verified end-to-end; flag-off is byte-identical. Currently deferred (see `Decisions.md` R-10/R-12):
`push` ≡ `navigate` (event ignored), per-screen `options` not yet projected, not-found/sitemap unwrap,
cross-tab hardware-back (needs a focus-order producer), and on-device verification.
