import * as React from 'react';

import type { ParamListBase } from '../core';
import type { LinkingOptions } from './types';

const MISSING_CONTEXT_ERROR = "Couldn't find a LinkingContext context.";

export const LinkingContext = React.createContext<{
  options?: LinkingOptions<ParamListBase>;
}>({
  get options(): any {
    throw new Error(MISSING_CONTEXT_ERROR);
  },
});

LinkingContext.displayName = 'LinkingContext';
