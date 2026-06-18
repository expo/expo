# `navigation-state` — Router v57 state model

A greenfield navigation state layer for expo-router, opt-in behind **`enableNewStateModel()`**. The
navigation tree becomes the single source of truth in a React-owned reducer; react-navigation and the
native views are demoted to a **render target**. When the flag is off, none of this runs and the
existing react-navigation-owned path is byte-identical.

Design rationale and the full decision log live at the repo root: **`RFC.md`** (the spec),
**`Decisions.md`** (P-1…P-15 state core, R-1…R-12 render layer), **`Plan.md`** / **`Plan-render.md`**.

## The model in one paragraph

State is a **homogeneous tree**: every navigator level is a `NavNode = { key, routes, index }`, and a
route may host a nested navigator via `child`. There is **no `type` field** — what an action means
against a node is decided by the navigator's **router**, declared at render (Decisions R-13). A router
has a single function, `getStateForAction(node, action)`, that returns the node's next local subtree
(scoped to itself + children) for an RFC action, or `null` if it doesn't handle it. The **dumb, pure
reducer** then just **swaps that subtree into the global tree by key** — it never interprets actions.

## Two layers

```
navigation-state/            ← CORE: routers + the store + URL conversion (no rendering)
└── render/                  ← RENDER: turns a NavNode slice into real screens via the existing RN views
```

## Core files (`navigation-state/`)

| File | Role |
|------|------|
| `types.ts` | The vocabulary: `NavNode` / `RouteEntry` / `GlobalNavState` (the tree), `NavAction` (the RFC action set: `navigate`/`goBack`/`goBackTo`/`replace`/`reset`/`preload`), `TargetRoute`, `NavRouter` (the `getStateForAction` contract). |
| `routers.ts` | The per-navigator **routers** `stackRouter` / `tabsRouter`: each `getStateForAction(node, action)` returns the next local subtree (or `null`). Pure and render-free — the stack/tabs semantics live here. Mirrors react-navigation's `Router.getStateForAction` over our `NavNode`. |
| `reducer.ts` | The **dumb, pure, synchronous reducer**. `reduce(state, { key, next, source })` replaces the node with `key` by `next`, rebuilding only the touched spine (untouched subtrees keep identity). Interprets nothing; ignores `source`. |
| `routerRegistry.ts` | Runtime `nodeKey → NavRouter` registry. Navigators `registerRouter(node.key, …)` at mount so the render-free resolvers can run a node's router without that component being in scope. Keyed by node key (unique tree-wide). |
| `keys.ts` | `createRouteKey(name)` — the **single key-minting authority** so hydration and runtime mint comparable keys (a JS push and its native echo dedupe). |
| `tree.ts` | `focusedChain(root)` — the nodes from root to the focused leaf (outermost first). Back-bubbling walks it leaf→root, looking each node's router up by `node.key`. |
| `hydration.ts` | URL → tree. `treeFromNavigationState(...)` converts react-navigation's nested `PartialState` into the homogeneous tree; `hydrate(path, options)` reuses the static, config-derived `getStateFromPath`. |
| `projection.ts` | Tree → URL. `navigationStateFromTree(tree)` is the inverse converter; `project(tree, options)` reuses `getPathFromState`, following `index` to the focused path. |
| `actions.ts` | `resolveNavigate(current, target)` — forward navigation: walks current vs a hydrated target, running each node's registered router with a `navigate` action; promotes an absent branch by grafting the hydrated child. Returns the new root (or `null`). |
| `back.ts` | `resolveBack(state, focusOrder?)` — render-free back bubbling: run each chain node's router with `goBack` (tabs translate focus-order → `goBackTo`). Returns `{ key, next }` if a node handles it, else `{ exit: true }` (for the Android `BackHandler`). |
| `store.tsx` | The **root store + imperative bridge**. `NavigationStateProvider` (one root `useReducer`, context-distributed), `useNavigationTree` / `useOptionalNavigationTree` (render reads), and the module bridge for reads/writes outside render: `dispatchNav({key,next,source})` (wrapped in `startTransition`) and `getNavSnapshot` (committed snapshot). |
| `enable.ts` | The flag: `enableNewStateModel()` / `isNewStateModelEnabled()` (read at render / per-dispatch, never module-eval) + a test-only reset. |
| `integrate.ts` | The **glue the flag seams call**, so each touch-point in the shared code stays a one-line branch: `getInitialAppTree` / `hydrateAppTree` (build the app tree, unwrapping the synthetic `__root` slot), `imperativeDispatch` (router queue → `resolveNavigate`/`resolveBack` → `dispatchNav`), `projectRouteInfo` (tree → `UrlObject`), `handleHardwareBack`. |

## Render files (`navigation-state/render/`)

The render layer treats navigators as pure render targets (RFC D3/D5). It does **not** use
react-navigation's `useNavigationBuilder` (the reducer owns state); instead it projects a `NavNode`
slice into the shape the **existing** views consume and supplies a `navigation` shim.

| File | Role |
|------|------|
| `navNodeContext.tsx` | `NavNodeProvider` / `useNavNodeSlice` — hands each navigator its `NavNode` slice. A parent provides a route's `child` to the nested navigator → this is the **recursion seam**. Slices are reference-stable, so navigators can memoize on them. |
| `projectToStackState.ts` | Projects a `NavNode` into the inert `StackNavigationState` shape `NativeStackView` / `ExperimentalStackView` read (one-way; never fed back to a builder). Route keys pass through unchanged. |
| `navigationShim.ts` | `createStackNavigationShim` — a **partial react-navigation `navigation` object** (the small surface `BaseRoute` + the views actually call: `isFocused`/`getState`/`addListener`/`replaceParams`/`dispatch`). Each write runs `stackRouter.getStateForAction` and commits the new node via `dispatchNav` (native-origin actions tagged `source:'native'`). |
| `emitter.ts` | `createEmitter` — a minimal per-navigator event bus for the shim's `addListener`/`emit`. |
| `createStackNavigator.tsx` | `createTreeStackNavigator(View)` + `Stack`. Reads the slice, builds descriptors (screens via expo-router's own `getQualifiedRouteComponent`, recursion via `NavNodeProvider`), wraps the view in the contexts `useNavigationBuilder`'s `NavigationContent` normally supplies (Theme / Helpers / StateListener / FocusedRouteKey / PreventRemove), and renders it. `ExperimentalStack` reuses this factory with a different view. |
| `createNativeTabsNavigator.tsx` | `NativeTabs`. Declared `<NativeTabs.Trigger>`s drive the bar (mount-all, P-10); the tree holds promoted tabs; a not-yet-visited tab renders a default node. A tab tap runs `tabsRouter.getStateForAction(navigate)` (set-index if promoted, else promote). Reuses the existing `NativeTabsView`. |
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
  ├─ hydrateAppTree('/a/b')                          // target tree (reuses getStateFromPath)
  ├─ actions.resolveNavigate(snapshot, target)       // runs each node's router (registry) → new root
  └─ store.dispatchNav({ key, next, source:'js' })   → reducer swaps the node → context updates → re-render
```

Within a navigator (a native pop / gesture / tab tap) the flow is the same, entered from the view via
the `navigation` shim → its router's `getStateForAction` → `dispatchNav({key,next})`.

### 3. Reads & back

```
useRouteInfo (flag)  → integrate.projectRouteInfo(tree) → getRouteInfoFromState → UrlObject  (usePathname etc.)
BackHandler / router.back → back.resolveBack(snapshot) → dispatchNav({key,next})  |  return false → exit
```

### The dependency shape

- `render/*` depends on the core (`store`, `routers`, `reducer`, `keys`, `projection`, `routerRegistry`)
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
cross-tab hardware-back (needs a focus-order producer), and on-device verification. The render-free
graft covers an absent branch that is the *direct child* of a mounted node; a navigate whose target
path crosses an unmounted *mid-path* navigator can't run that node's router and is not resolved (the
documented C12 relaxation, R-13) — the static D8 manifest is the eventual full closure.
