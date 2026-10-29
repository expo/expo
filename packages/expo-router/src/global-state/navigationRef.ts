import { createNavigationContainerRef } from '../react-navigation/core/createNavigationContainerRef';

// TODO(@ubax): scope this module-level mutable state to each navigation container
export const navigationRef = createNavigationContainerRef<ReactNavigation.RootParamList>();
