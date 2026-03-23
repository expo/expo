import * as React from 'react';

const MISSING_CONTEXT_ERROR =
  "Couldn't find an UnhandledLinkingContext context.";

export const UnhandledLinkingContext = React.createContext<{
  lastUnhandledLink: string | undefined;
  setLastUnhandledLink: (lastUnhandledUrl: string | undefined) => void;
}>({
  get lastUnhandledLink(): any {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
  get setLastUnhandledLink(): any {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
});

UnhandledLinkingContext.displayName = 'UnhandledLinkingContext';
