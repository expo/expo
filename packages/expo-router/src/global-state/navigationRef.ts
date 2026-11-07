import { createNavigationContainerRef } from '../react-navigation/core/createNavigationContainerRef';

// TODO(@ubax): scope this module-level mutable state to each navigation container
export const navigationRef = createNavigationContainerRef<ReactNavigation.RootParamList>();

type NavigationContainer = NonNullable<typeof navigationRef.current>;

// The containers of the mounted roots, oldest first. Two roots can be mounted at once: an Android
// Activity relaunch mounts the new root before it unmounts the old one.
const mountedContainers: NavigationContainer[] = [];

export function setNavigationContainer(container: NavigationContainer | null) {
  if (container == null) {
    return;
  }
  mountedContainers.push(container);
  navigationRef.current = container;

  return () => {
    mountedContainers.splice(mountedContainers.indexOf(container), 1);
    const newestContainer = mountedContainers[mountedContainers.length - 1] ?? null;
    // Setting `current` adds every listener that was added while it was null to the container again.
    if (navigationRef.current !== newestContainer) {
      navigationRef.current = newestContainer;
    }
  };
}
