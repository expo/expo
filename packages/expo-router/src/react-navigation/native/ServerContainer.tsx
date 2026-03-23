import { CurrentRenderContext } from '@react-navigation/core';
import * as React from 'react';

import { ServerContext, type ServerContextType } from './ServerContext';
import type { ServerContainerRef } from './types';

type Props = ServerContextType & {
  children: React.ReactNode;
};

/**
 * Container component for server rendering.
 *
 * @param props.location Location object to base the initial URL for SSR.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which contains helper methods.
 */
export const ServerContainer = React.forwardRef(function ServerContainer(
  { children, location }: Props,
  ref: React.Ref<ServerContainerRef>
) {
  React.useEffect(() => {
    console.error(
      "'ServerContainer' should only be used on the server with 'react-dom/server' for SSR."
    );
  }, []);

  // eslint-disable-next-line @eslint-react/no-unstable-context-value
  const current: { options?: object } = {};

  if (ref) {
    const value = {
      getCurrentOptions() {
        return current.options;
      },
    };

    // We write to the `ref` during render instead of `React.useImperativeHandle`
    // This is because `useImperativeHandle` will update the ref after 'commit',
    // and there's no 'commit' phase during SSR.
    // Mutating ref during render is unsafe in concurrent mode, but we don't care about it for SSR.
    if (typeof ref === 'function') {
      ref(value);
    } else {
      ref.current = value;
    }
  }

  return (
    // eslint-disable-next-line @eslint-react/no-unstable-context-value
    <ServerContext.Provider value={{ location }}>
      <CurrentRenderContext.Provider value={current}>
        {children}
      </CurrentRenderContext.Provider>
    </ServerContext.Provider>
  );
});
