'use client';
import React from 'react';
import { Drawer } from 'vaul';

import modalStyles from './modalStyles';
import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';

function TransparentModalStackRouteDrawer({
  routeKey,
  options,
  renderScreen,
  onDismiss,
}: {
  routeKey: string;
  options: ExtendedStackNavigationOptions;
  renderScreen: () => React.ReactNode;
  onDismiss: () => void;
}) {
  const handleOpenChange = (open: boolean) => {
    if (!open) onDismiss();
  };

  return (
    <Drawer.Root
      defaultOpen
      key={`${routeKey}-transparent`}
      dismissible={options.gestureEnabled ?? false}
      onAnimationEnd={handleOpenChange}>
      <Drawer.Portal>
        <Drawer.Content className={modalStyles.transparentDrawerContent}>
          {/* Figure out how to add title and description to the modal for screen readers */}
          <Drawer.Title about="" aria-describedby="" className={modalStyles.srOnly} />
          <Drawer.Description about="" className={modalStyles.srOnly} />
          {/* Render the screen content */}
          <div className={modalStyles.modalBody}>{renderScreen()}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export { TransparentModalStackRouteDrawer };

/**
 * SSR-safe viewport detection: initial render always returns `false` so that
 * server and client markup match. The actual media query evaluation happens
 * after mount.
 *
 * @internal
 */
export function useIsDesktop(breakpoint: number = 768) {
  const isWeb = process.env.EXPO_OS === 'web';

  // Ensure server-side and initial client render agree (mobile first).
  const [isDesktop, setIsDesktop] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!isWeb || typeof window === 'undefined') return;

    const mql = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

    // Update immediately after mount
    setIsDesktop(mql.matches);

    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, [breakpoint, isWeb]);

  return isDesktop;
}
