import { InternalActionProvider } from './wrapped-provider';

function withInternalState(fn) {
  return fn();
}

async function innerAction({ action }, ...args) {
  'use server';
  return await withInternalState(async () => {
    const result = await action(...args);
    return [null, result];
  });
}

function wrapAction(action) {
  return innerAction.bind(null, { action });
}

function wrapActions(actions: Record<string, any>) {
  const wrappedActions = {};
  for (const name in actions) {
    wrappedActions[name] = wrapAction(actions[name]);
  }
  return wrappedActions;
}

// Returns a React provider that provides wrapped actions
export function createActionProvider({ actions }: { actions: Record<string, any> }) {
  const wrapped = wrapActions(actions);
  return function ActionProvider({ children }: { children: React.ReactNode }) {
    return <InternalActionProvider actions={wrapped}>{children}</InternalActionProvider>;
  };
}
