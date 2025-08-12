'use client';
import React from 'react';
import { Drawer } from 'vaul';

import modalStyles from './modalStyles';
import { CSSWithVars } from './types';
import { useIsDesktop } from './utils';
import { ExtendedStackNavigationOptions } from '../../layouts/StackClient';

function ModalStackRouteDrawer({
  routeKey,
  options,
  renderScreen,
  onDismiss,
  themeColors,
}: {
  routeKey: string;
  options: ExtendedStackNavigationOptions;
  renderScreen: () => React.ReactNode;
  onDismiss: () => void;
  themeColors: { card: string; background: string };
}) {
  const [open, setOpen] = React.useState(true);
  // Determine sheet vs. modal with an SSR-safe hook. The first render (during
  // hydration) always assumes mobile/sheet to match the server markup; an
  // effect then updates the state after mount if the viewport is desktop.
  const isDesktop = useIsDesktop();
  const isSheet = !isDesktop;

  // Resolve snap points logic.
  const allowed = options.sheetAllowedDetents;

  const isArrayDetents = Array.isArray(allowed);
  const useCustomSnapPoints = isArrayDetents && !(allowed.length === 1 && allowed[0] === 1);

  let snapPoints: (number | string)[] | undefined = useCustomSnapPoints
    ? (allowed as (number | string)[])
    : undefined;

  if (!isSheet) {
    snapPoints = [1];
  }

  const [snap, setSnap] = React.useState<number | string | null>(
    useCustomSnapPoints && isArrayDetents ? allowed[0] : 1
  );

  // Update the snap value when custom snap points change.
  React.useEffect(() => {
    if (isSheet) {
      const next = useCustomSnapPoints && isArrayDetents ? allowed[0] : 1;
      setSnap(next);
    } else {
      // Desktop modal always fixed snap at 1
      setSnap(1);
    }
  }, [isSheet, useCustomSnapPoints, isArrayDetents, allowed]);

  // Map react-native-screens ios sheet undimmed logic to Vaul's fadeFromIndex
  const fadeFromIndex = isSheet
    ? options.sheetLargestUndimmedDetentIndex === 'last'
      ? (snapPoints?.length ?? 0)
      : typeof options.sheetLargestUndimmedDetentIndex === 'number'
        ? options.sheetLargestUndimmedDetentIndex + 1
        : 0
    : 0;

  // --- Styling -----------------------------------------------------------

  // Using CSS variables so defaults live in CSS and can be overridden via props.
  const modalStyleVars: CSSWithVars = {
    backgroundColor: themeColors.background,
  };

  if (!isSheet) {
    if (options.webModalStyle?.width) {
      modalStyleVars['--expo-router-modal-width'] =
        typeof options.webModalStyle.width === 'number'
          ? `${options.webModalStyle.width}px`
          : options.webModalStyle.width;

      modalStyleVars['--expo-router-modal-max-width'] =
        typeof options.webModalStyle.width === 'number'
          ? `${options.webModalStyle.width}px`
          : options.webModalStyle.width;

      // Also set explicit width so browsers that ignore CSS vars in `width` prop still work.
      modalStyleVars.width =
        typeof options.webModalStyle.width === 'number'
          ? `${options.webModalStyle.width}px`
          : options.webModalStyle.width;
    }

    // Min width override
    if (options.webModalStyle?.minWidth) {
      const mw =
        typeof options.webModalStyle.minWidth === 'number'
          ? `${options.webModalStyle.minWidth}px`
          : options.webModalStyle.minWidth;
      modalStyleVars['--expo-router-modal-min-width'] = mw;
      modalStyleVars.minWidth = mw;
    }

    if (options.webModalStyle?.height) {
      const h =
        typeof options.webModalStyle.height === 'number'
          ? `${options.webModalStyle.height}px`
          : options.webModalStyle.height;
      modalStyleVars['--expo-router-modal-height'] = h;
      modalStyleVars.maxHeight = h;
      modalStyleVars.height = h;
      modalStyleVars.minHeight = h;
    }

    // Separate min-height override (takes precedence over modalHeight)
    if (options.webModalStyle?.minHeight) {
      const mh =
        typeof options.webModalStyle.minHeight === 'number'
          ? `${options.webModalStyle.minHeight}px`
          : options.webModalStyle.minHeight;
      modalStyleVars['--expo-router-modal-min-height'] = mh;
      modalStyleVars.minHeight = mh;
    }
  }

  const fitToContents = options.sheetAllowedDetents === 'fitToContents';

  if (fitToContents) {
    modalStyleVars.height = 'auto';
    modalStyleVars.minHeight = 'auto';

    // TODO:(@Hirbod) Clarify if we should limit maxHeight to sheets only
    // Allow sheet to grow with content but never exceed viewport height
    // dvh is important, otherwise it will scale over the visible viewport height
    modalStyleVars.maxHeight = '100dvh';
  }

  // Apply corner radius (default 10px)
  const radiusValue = options.sheetCornerRadius ?? 10;
  const radiusCss = typeof radiusValue === 'number' ? `${radiusValue}px` : radiusValue;

  if (options.webModalStyle?.border) {
    modalStyleVars['--expo-router-modal-border'] = options.webModalStyle.border;
  }

  if (isSheet) {
    // Only top corners for mobile sheet
    modalStyleVars.borderTopLeftRadius = radiusCss;
    modalStyleVars.borderTopRightRadius = radiusCss;

    // Only apply CSS var override if a custom corner radius was provided
    if (options.sheetCornerRadius) {
      modalStyleVars['--expo-router-modal-border-radius'] = radiusCss;
    }
  } else {
    // All corners for desktop modal
    if (options.sheetCornerRadius) {
      modalStyleVars['--expo-router-modal-border-radius'] = radiusCss;
    }
  }
  // --- End Styling -----------------------------------------------------------

  const handleOpenChange = (open: boolean) => {
    if (!open) onDismiss();
  };

  // Props that only make sense for sheets
  const sheetProps = isSheet
    ? {
        snapPoints: snapPoints as (number | string)[],
        activeSnapPoint: snap,
        setActiveSnapPoint: setSnap,
        fadeFromIndex,
      }
    : {};

  return (
    <Drawer.Root
      key={`${routeKey}-${isSheet ? 'sheet' : 'modal'}`}
      open={open}
      dismissible={options.gestureEnabled ?? true}
      onAnimationEnd={handleOpenChange}
      shouldScaleBackground
      autoFocus
      onOpenChange={setOpen}
      {...sheetProps}>
      <Drawer.Portal>
        <Drawer.Overlay
          className={modalStyles.overlay}
          style={
            options.webModalStyle?.overlayBackground
              ? ({
                  '--expo-router-modal-overlay-background': options.webModalStyle.overlayBackground,
                } as React.CSSProperties)
              : undefined
          }
        />
        <Drawer.Content
          aria-describedby="modal-description"
          className={modalStyles.drawerContent}
          style={{
            pointerEvents: 'none',
            // This needs to be limited to sheets, otherwise it will position the modal at the bottom of the screen
            ...(isSheet && fitToContents ? { height: 'auto' } : null),
          }}>
          <div
            className={modalStyles.modal}
            data-presentation={isSheet ? 'formSheet' : 'modal'}
            style={modalStyleVars}>
            {/* TODO:(@Hirbod) Figure out how to add title and description to the modal for screen readers in a meaningful way */}
            <Drawer.Title about="" aria-describedby="" className={modalStyles.srOnly} />
            <Drawer.Description about="" className={modalStyles.srOnly} />
            {/* Render the screen content */}
            <div className={modalStyles.modalBody}>{renderScreen()}</div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export { ModalStackRouteDrawer };
