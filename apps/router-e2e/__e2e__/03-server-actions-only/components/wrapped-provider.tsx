'use client';

import React from 'react';

const ActionProvider = React.createContext(null);

export function InternalActionProvider({ children, actions }) {
  if (!('use' in React)) {
    throw new Error('Unsupported React version.');
  }

  const clientWrappedActions = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(actions).map(([key, action]) => [
          key,
          async (...args) => {
            const [, result] = await action(...args);
            return result;
          },
        ])
      ),
    [actions]
  );

  return <ActionProvider.Provider value={clientWrappedActions}>{children}</ActionProvider.Provider>;
}

export function useActions() {
  const ctx = React.use(ActionProvider);
  if (!ctx) {
    throw new Error('No action provider found.');
  }
  return ctx;
}
