/**
 * in the test screens in apps/test-suite/tests you can specify:
 * - name: visible in the list
 * - route: string used for deep linking
 *
 * When you specify a route, you need to also use the same value in ScreensList in ExpoApisStackNavigator.tsx
 * */
export const getScreenId = ({ name, route }: { name: string; route?: string }): string => {
  return route ?? name.toLowerCase();
};
