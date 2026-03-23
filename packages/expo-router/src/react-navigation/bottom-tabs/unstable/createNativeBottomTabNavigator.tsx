export const createNativeBottomTabNavigator: typeof import('./createNativeBottomTabNavigator.native').createNativeBottomTabNavigator =
  () => {
    throw new Error('Native Bottom Tabs are not supported on this platform.');
  };
