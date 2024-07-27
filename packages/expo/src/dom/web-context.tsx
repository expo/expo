import React from 'react';

/**
 * Context provided to the web app from the native app.
 */
export type Context = {
  linkTo(path: string, event?: string): void;
};

export const WebContext = React.createContext<Context>({
  linkTo: () => {},
});
