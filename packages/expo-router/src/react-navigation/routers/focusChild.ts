import type { NavigationAction } from './types';

// Synthetic action dispatched by the root reducer's ancestor-refocus walk (and the UI tab router's
// same-tree jump path) to focus the child route with the given key. Each router handles it as a case
// of `getStateForAction` using its route-focus logic; returning `state` unchanged is a no-op focus.
export const FOCUS_CHILD = '__focus_child__';

export type FocusChildAction = NavigationAction & {
  type: typeof FOCUS_CHILD;
  payload: { key: string };
};

// Returns the typed focus action, or `undefined`. A returns-value helper rather than a type predicate:
// each router's `action` union doesn't include this action, so an `action is …` guard would narrow
// `action` to `never` at those call sites.
export const asFocusChildAction = (action: NavigationAction): FocusChildAction | undefined =>
  action.type === FOCUS_CHILD ? (action as FocusChildAction) : undefined;

export const focusChild = (key: string): FocusChildAction => ({
  type: FOCUS_CHILD,
  payload: { key },
});

// Whether an action that just changed a navigator's focus should propagate that focus up through the
// ancestors. This is the decision the removed `shouldActionChangeFocus` used to encode.
export const isFocusChangingAction = (action: NavigationAction): boolean =>
  action.type === 'NAVIGATE' || action.type === 'NAVIGATE_DEPRECATED';
