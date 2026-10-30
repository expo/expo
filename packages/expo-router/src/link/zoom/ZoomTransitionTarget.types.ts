import type { PropsWithChildren } from 'react';

import type { Route } from '../../react-navigation/native';
import type { NativeStackNavigationOptions } from '../../react-navigation/native-stack/types';

export interface ZoomTransitionTargetProps extends PropsWithChildren {
  route: Route<string>;
  presentation: NativeStackNavigationOptions['presentation'];
  gestureEnabled?: boolean;
}
