import * as React from 'react';

import type { ParamListBase } from '../routers';
import { createNavigationContainerRef } from './createNavigationContainerRef';
import type { NavigationContainerRefWithCurrent } from './types';

export function useNavigationContainerRef<
  ParamList extends ParamListBase = ReactNavigation.RootParamList,
>(): NavigationContainerRefWithCurrent<ParamList> {
  const navigation = React.useRef<NavigationContainerRefWithCurrent<ParamList> | null>(null);

  if (navigation.current == null) {
    navigation.current = createNavigationContainerRef<ParamList>();
  }

  return navigation.current;
}
