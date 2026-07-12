'use client';

import { store } from '../global-state/store';

/**
 * Returns a React `ref` to the app's root navigation container. Use it to imperatively read or
 * control navigation from outside a route, or to subscribe to container-level events such as
 * `state` and `__unsafe_action__`.
 *
 * `ref.current` is `null` until the container mounts, so guard against `null` before calling
 * methods on it. Reading it inside an effect or event handler is safe; reading it during the
 * first render is not.
 *
 * @return A `ref` to the root navigation container.
 */
export function useNavigationContainerRef() {
  return store.navigationRef;
}
