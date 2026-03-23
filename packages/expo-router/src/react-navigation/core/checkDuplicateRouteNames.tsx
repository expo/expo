import type { NavigationState, PartialState } from '@react-navigation/routers';

export function checkDuplicateRouteNames(state: NavigationState) {
  const duplicates: string[][] = [];

  const getRouteNames = (
    location: string,
    state: NavigationState | PartialState<NavigationState>
  ) => {
    state.routes.forEach((route: (typeof state.routes)[0]) => {
      const currentLocation = location
        ? `${location} > ${route.name}`
        : route.name;

      route.state?.routeNames?.forEach((routeName) => {
        if (routeName === route.name) {
          duplicates.push([
            currentLocation,
            `${currentLocation} > ${route.name}`,
          ]);
        }
      });

      if (route.state) {
        getRouteNames(currentLocation, route.state);
      }
    });
  };

  getRouteNames('', state);

  return duplicates;
}
