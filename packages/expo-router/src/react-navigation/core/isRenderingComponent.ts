import * as React from 'react';

// Private React internals, missing from the public types. May be absent in other React versions.
const internals = (
  React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: {
      A?: { getOwner?: () => unknown } | null;
    };
  }
).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

/** Returns true while React renders a component. Dev-only diagnostic. */
export function isRenderingComponent(): boolean {
  // The owner is the component that React renders now. React reads it the same way for new elements:
  // https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react/src/jsx/ReactJSXElement.js#L50-L59
  // React sets `A` only during render, so the owner is null in effects and event handlers:
  // https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react-reconciler/src/ReactFiberWorkLoop.js#L2640
  // `getOwner` exists only in development builds:
  // https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react-reconciler/src/ReactFiberAsyncDispatcher.js#L38-L42
  return internals?.A?.getOwner?.() != null;
}
