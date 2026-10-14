import * as React from 'react';

type Dispatcher = { useState: unknown; useEffect: unknown };

// Private React internals, missing from the public types. May be absent in other React versions.
const internals = (
  React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: { H?: Dispatcher | null };
  }
).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

/** Returns true while React renders a function component. Dev-only diagnostic. */
export function isRenderingFunctionComponent(): boolean {
  // React reads the current hooks dispatcher from `H`:
  // https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react/src/ReactHooks.js#L25
  const dispatcher = internals?.H;
  return (
    // Outside React work the dispatcher is null:
    // https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react/src/ReactHooks.js#L27
    dispatcher != null &&
    // During commit and effects it is the "context only" dispatcher, where every hook
    // is the same throw function:
    // https://github.com/react/react/blob/07dde64da1abd1525120b9ae49672386486e33c3/packages/react-reconciler/src/ReactFiberHooks.js#L3898
    dispatcher.useState !== dispatcher.useEffect
  );
}
