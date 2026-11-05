import type { PropsWithChildren } from 'react';

import type { Route } from '../../react-navigation/native';

export interface ZoomTransitionTargetProps extends PropsWithChildren {
  route: Route<string>;
}
