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
  const dispatcher = internals?.H;
  // Outside React work the dispatcher is null. During commit and effects it is the
  // "context only" dispatcher, where every hook is the same throw function.
  return dispatcher != null && dispatcher.useState !== dispatcher.useEffect;
}
