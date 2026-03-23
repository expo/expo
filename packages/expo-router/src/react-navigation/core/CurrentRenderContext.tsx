import * as React from 'react';

/**
 * Context which holds the values for the current navigation tree.
 * Intended for use in SSR. This is not safe to use on the client.
 */
export const CurrentRenderContext = React.createContext<
  { options?: object } | undefined
>(undefined);
