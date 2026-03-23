import * as React from 'react';

import type { StackCardInterpolationProps } from '../types';

export const CardAnimationContext = React.createContext<
  StackCardInterpolationProps | undefined
>(undefined);
