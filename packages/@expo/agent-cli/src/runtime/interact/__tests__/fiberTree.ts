// A fiber tree to run the shipped expressions against, built to the shapes the spike recorded.
//
// The expressions of `../expression.ts` are the whole of this feature: every rule llp/0018-interaction-commands.rfc.md calls
// non-negotiable — match by element, a group that is not a contiguous chain, the shallowest handler,
// the focus filter, the disabled refusal — is encoded in a string that runs inside the app. A unit
// test of the TypeScript around it proves none of them.
//
// So the tests evaluate the real expression against a fake `__REACT_DEVTOOLS_GLOBAL_HOOK__` whose
// roots hold fibers of the same shape the spike's `out-*.json` recorded: `elementType` a string for
// a host component and a function or object for a composite, `memoizedProps` holding the props as
// written in JSX, and `child` / `sibling` / `return` wired the way the reconciler wires them.
//
// @ref llp/0018-interaction-commands.rfc.md §Must not lose
// @ref src/runtime/__tests__/fixtures/spike-view-tree/README.md

/** What a test writes: one node of a tree, with the children under it. */
export interface FiberSpec {
  /**
   * The component name, as `nameOf` will report it.
   *
   * A name in `RCT…`/lower-case host form is made a **host** fiber (`elementType` a string, which
   * is the only host test the shipped expression makes); anything else becomes a composite whose
   * `elementType` is a named function.
   */
  name: string;
  /** Whether this fiber is a host component, when the name does not settle it. */
  host?: boolean;
  /** `memoizedProps`, as written in JSX. A string is a text fiber's props. */
  props?: Record<string, unknown> | string;
  children?: FiberSpec[];
}

/** The fields of a fiber the expressions read. */
export interface FakeFiber {
  elementType: unknown;
  type: unknown;
  memoizedProps: unknown;
  child: FakeFiber | null;
  sibling: FakeFiber | null;
  return: FakeFiber | null;
  stateNode: unknown;
}

/** Host names look like React Native's: `RCTView`, `RCTText`, or an explicit `host: true`. */
function isHostName(spec: FiberSpec): boolean {
  return spec.host ?? /^RCT|^RNS/.test(spec.name);
}

/** Build one fiber and its subtree, wiring `child`, `sibling` and `return` as the reconciler does. */
export function buildFiber(spec: FiberSpec, parent: FakeFiber | null = null): FakeFiber {
  // A named function is what `nameOf` reads `displayName || name` off. Object.defineProperty rather
  // than a named declaration, because the name is data here.
  const elementType = isHostName(spec)
    ? spec.name
    : Object.defineProperty(function composite() {}, 'name', { value: spec.name });
  const fiber: FakeFiber = {
    elementType,
    type: elementType,
    memoizedProps: spec.props ?? null,
    child: null,
    sibling: null,
    return: parent,
    stateNode: null,
  };

  let previous: FakeFiber | null = null;
  for (const childSpec of spec.children ?? []) {
    const child = buildFiber(childSpec, fiber);
    if (previous) {
      previous.sibling = child;
    } else {
      fiber.child = child;
    }
    previous = child;
  }
  return fiber;
}

/** A React Navigation `Screen` fiber, which is where "which screen is on screen" is answerable. */
export function screen(name: string, focused: boolean, children: FiberSpec[] = []): FiberSpec {
  return {
    name: 'Screen',
    props: { name, isFocused: focused, routeKey: `${name}-key` },
    children,
  };
}

/**
 * Install a fake DevTools hook over one or more root trees, and take it away again.
 *
 * @returns the restore callback, to be run in `afterEach`.
 */
export function installHook(...trees: FiberSpec[]): () => void {
  const global = globalThis as Record<string, unknown>;
  const previous = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const roots = trees.map((tree) => ({ current: buildFiber(tree) }));
  global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    getFiberRoots: (rendererId: number) => (rendererId === 1 ? new Set(roots) : new Set()),
  };
  return () => {
    if (previous === undefined) {
      delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    } else {
      global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = previous;
    }
  };
}

/** Remove the hook entirely, for the refusal path. */
export function removeHook(): () => void {
  const global = globalThis as Record<string, unknown>;
  const previous = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  return () => {
    if (previous !== undefined) {
      global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = previous;
    }
  };
}

/** A hook with no `getFiberRoots`, which is the other half of the one guard. */
export function installHookWithoutRoots(): () => void {
  const global = globalThis as Record<string, unknown>;
  const previous = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { renderers: new Map() };
  return () => {
    if (previous === undefined) {
      delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    } else {
      global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = previous;
    }
  };
}

/**
 * Run one of the shipped expressions the way `Runtime.evaluate` runs it.
 *
 * `new Function` rather than `eval`: the expression is a self-contained IIFE that reads only
 * `globalThis`, so a fresh function scope is the closest thing in Node to the runtime's own
 * top-level evaluation — and it cannot see this file's bindings, which is the property that makes
 * the test about the expression rather than about the test.
 */
export function evaluateExpression<T>(expression: string): T {
  // oxlint-disable-next-line no-new-func -- the subject of the test is a source string.
  return new Function(`return (${expression});`)() as T;
}
