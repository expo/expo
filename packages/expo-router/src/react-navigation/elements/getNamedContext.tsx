import * as React from 'react';

const contexts = '__react_navigation__elements_contexts';

declare global {
  var __react_navigation__elements_contexts: Map<string, React.Context<any>>;
}

// We use a global variable to keep our contexts so that we can reuse same contexts across packages
globalThis[contexts] =
  globalThis[contexts] ?? new Map<string, React.Context<any>>();

export function getNamedContext<T>(
  name: string,
  initialValue: T
): React.Context<T> {
  let context = globalThis[contexts].get(name);

  if (context) {
    return context;
  }

  context = React.createContext<T>(initialValue);
  context.displayName = name;

  globalThis[contexts].set(name, context);

  return context;
}
