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
      autoFocus
      key={`${routeKey}-transparent`}
      dismissible={options.gestureEnabled ?? false}
      onAnimationEnd={handleOpenChange}>
      <Drawer.Portal>
        <Drawer.Content className={modalStyles.transparentDrawerContent}>
          {/* TODO:(@Hirbod) Figure out how to add title and description to the modal for screen readers in a meaningful way */}
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
