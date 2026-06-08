'use client';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import type { NavigatorState } from 'standard-navigation';

import useLatestCallback from '../../../utils/useLatestCallback';
import { type DrawerStatus, type ParamListBase, useLocale, useTheme } from '../../native';
import type {
  DrawerContentComponentProps,
  DrawerDescriptorMap,
  DrawerEmit,
  DrawerHeaderProps,
  DrawerNavigationActions,
  DrawerNavigationConfig,
  DrawerNavigationProp,
} from '../types';
import { DrawerContent } from './DrawerContent';
import { DrawerToggleButton } from './DrawerToggleButton';
import { MaybeScreen, MaybeScreenContainer } from './ScreenFallback';
import {
  getHeaderTitle,
  Header,
  SafeAreaProviderCompat,
  Screen,
  useFrameSize,
} from '../../elements';
import { DrawerPositionContext } from '../utils/DrawerPositionContext';
import { DrawerStatusContext } from '../utils/DrawerStatusContext';
import { addCancelListener } from '../utils/addCancelListener';

type Props = DrawerNavigationConfig &
  DrawerNavigationActions & {
    defaultStatus: DrawerStatus;
    state: NavigatorState;
    descriptors: DrawerDescriptorMap;
    /** Current drawer status, derived from the navigator state in `createProps`. */
    drawerStatus: DrawerStatus;
    /** Keys of routes that have been preloaded, derived from the navigator state in `createProps`. */
    preloadedRouteKeys: readonly string[];
    /** The navigator's state key, used as the target for emitted navigator-level events. */
    navigatorKey: string;
    isFocused: () => boolean;
    emit: DrawerEmit;
    /** Pops the previous route's nested stack to top on blur (needs raw nested state, lives in `createProps`). */
    handlePopToTopOnBlur: (routeKey: string) => void;
  };

const DRAWER_BORDER_RADIUS = 16;

const renderDrawerContentDefault = (props: DrawerContentComponentProps) => (
  <DrawerContent {...props} />
);

function DrawerViewBase({
  state,
  descriptors,
  defaultStatus,
  drawerStatus,
  preloadedRouteKeys,
  navigatorKey,
  isFocused,
  emit,
  navigate,
  goBack,
  openDrawer: openDrawerAction,
  closeDrawer: closeDrawerAction,
  toggleDrawer,
  handlePopToTopOnBlur,
  drawerContent = renderDrawerContentDefault,
  detachInactiveScreens = Platform.OS === 'web' ||
    Platform.OS === 'android' ||
    Platform.OS === 'ios',
}: Props) {
  const { direction } = useLocale();

  const focusedRouteKey = state.routes[state.index]!.key;
  const {
    drawerHideStatusBarOnOpen,
    drawerPosition = direction === 'rtl' ? 'right' : 'left',
    drawerStatusBarAnimation,
    drawerStyle,
    drawerType = Platform.select({ ios: 'slide', default: 'front' }),
    configureGestureHandler,
    keyboardDismissMode,
    overlayColor = 'rgba(0, 0, 0, 0.5)',
    swipeEdgeWidth,
    swipeEnabled = Platform.OS !== 'web' && Platform.OS !== 'windows' && Platform.OS !== 'macos',
    swipeMinDistance,
    overlayAccessibilityLabel,
  } = descriptors[focusedRouteKey]!.options;

  const [loaded, setLoaded] = React.useState([focusedRouteKey]);

  if (!loaded.includes(focusedRouteKey)) {
    setLoaded([...loaded, focusedRouteKey]);
  }

  const previousRouteKeyRef = React.useRef(focusedRouteKey);

  React.useEffect(() => {
    const previousRouteKey = previousRouteKeyRef.current;

    if (
      previousRouteKey !== focusedRouteKey &&
      descriptors[previousRouteKey]?.options.popToTopOnBlur
    ) {
      handlePopToTopOnBlur(previousRouteKey);
    }

    previousRouteKeyRef.current = focusedRouteKey;
  }, [descriptors, focusedRouteKey, handlePopToTopOnBlur]);

  const dimensions = useFrameSize((size) => size, true);

  const { colors } = useTheme();

  const handleDrawerOpen = useLatestCallback(() => {
    openDrawerAction();
  });

  const handleDrawerClose = useLatestCallback(() => {
    closeDrawerAction();
  });

  const handleGestureStart = useLatestCallback(() => {
    emit({
      type: 'gestureStart',
      target: navigatorKey,
    });
  });

  const handleGestureEnd = useLatestCallback(() => {
    emit({
      type: 'gestureEnd',
      target: navigatorKey,
    });
  });

  const handleGestureCancel = useLatestCallback(() => {
    emit({
      type: 'gestureCancel',
      target: navigatorKey,
    });
  });

  const handleTransitionStart = useLatestCallback((closing: boolean) => {
    emit({
      type: 'transitionStart',
      data: { closing },
      target: navigatorKey,
    });
  });

  const handleTransitionEnd = useLatestCallback((closing: boolean) => {
    emit({
      type: 'transitionEnd',
      data: { closing },
      target: navigatorKey,
    });
  });

  React.useEffect(() => {
    if (drawerStatus === defaultStatus || drawerType === 'permanent') {
      return;
    }

    const handleHardwareBack = () => {
      // We shouldn't handle the back button if the parent screen isn't focused
      // This will avoid the drawer overriding event listeners from a focused screen
      if (!isFocused()) {
        return false;
      }

      if (defaultStatus === 'open') {
        handleDrawerOpen();
      } else {
        handleDrawerClose();
      }

      return true;
    };

    // We only add the listeners when drawer opens
    // This way we can make sure that the listener is added as late as possible
    // This will make sure that our handler will run first when back button is pressed
    return addCancelListener(handleHardwareBack);
  }, [defaultStatus, drawerStatus, drawerType, handleDrawerClose, handleDrawerOpen, isFocused]);

  const renderDrawerContent = () => {
    return (
      <DrawerPositionContext.Provider value={drawerPosition}>
        {drawerContent({
          state,
          descriptors,
          isFocused,
          emit,
          navigate,
          goBack,
          openDrawer: openDrawerAction,
          closeDrawer: closeDrawerAction,
          toggleDrawer,
        })}
      </DrawerPositionContext.Provider>
    );
  };

  const renderSceneContent = () => {
    return (
      <MaybeScreenContainer enabled={detachInactiveScreens} hasTwoStates style={styles.content}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key]!;
          const { lazy = true } = descriptor.options;
          const isFocusedRoute = state.index === index;
          const isPreloaded = preloadedRouteKeys.includes(route.key);

          if (lazy && !loaded.includes(route.key) && !isFocusedRoute && !isPreloaded) {
            // Don't render a lazy screen if we've never navigated to it or it wasn't preloaded
            return null;
          }

          const {
            freezeOnBlur,
            header = ({ layout, options }: DrawerHeaderProps) => (
              <Header
                {...options}
                layout={layout}
                title={getHeaderTitle(options, route.name)}
                headerLeft={
                  drawerPosition === 'left' && options.headerLeft == null
                    ? (props) => <DrawerToggleButton {...props} />
                    : options.headerLeft
                }
                headerRight={
                  drawerPosition === 'right' && options.headerRight == null
                    ? (props) => <DrawerToggleButton {...props} />
                    : options.headerRight
                }
              />
            ),
            headerShown,
            headerStatusBarHeight,
            headerTransparent,
            sceneStyle,
          } = descriptor.options;

          return (
            <MaybeScreen
              key={route.key}
              style={[StyleSheet.absoluteFill, { zIndex: isFocusedRoute ? 0 : -1 }]}
              visible={isFocusedRoute}
              enabled={detachInactiveScreens}
              freezeOnBlur={freezeOnBlur}
              shouldFreeze={!isFocusedRoute && !isPreloaded}>
              <Screen
                focused={isFocusedRoute}
                route={descriptor.route}
                navigation={descriptor.navigation}
                headerShown={headerShown}
                headerStatusBarHeight={headerStatusBarHeight}
                headerTransparent={headerTransparent}
                header={header({
                  layout: dimensions,
                  route: descriptor.route,
                  navigation: descriptor.navigation as DrawerNavigationProp<ParamListBase>,
                  options: descriptor.options,
                })}
                style={sceneStyle}>
                {descriptor.render()}
              </Screen>
            </MaybeScreen>
          );
        })}
      </MaybeScreenContainer>
    );
  };

  return (
    <DrawerStatusContext.Provider value={drawerStatus}>
      <Drawer
        open={drawerStatus !== 'closed'}
        onOpen={handleDrawerOpen}
        onClose={handleDrawerClose}
        onGestureStart={handleGestureStart}
        onGestureEnd={handleGestureEnd}
        onGestureCancel={handleGestureCancel}
        onTransitionStart={handleTransitionStart}
        onTransitionEnd={handleTransitionEnd}
        layout={dimensions}
        direction={direction}
        configureGestureHandler={configureGestureHandler}
        swipeEnabled={swipeEnabled}
        swipeEdgeWidth={swipeEdgeWidth}
        swipeMinDistance={swipeMinDistance}
        hideStatusBarOnOpen={drawerHideStatusBarOnOpen}
        statusBarAnimation={drawerStatusBarAnimation}
        keyboardDismissMode={keyboardDismissMode}
        drawerType={drawerType}
        overlayAccessibilityLabel={overlayAccessibilityLabel}
        drawerPosition={drawerPosition}
        drawerStyle={[
          { backgroundColor: colors.card },
          drawerType === 'permanent' &&
            ((
              Platform.OS === 'web'
                ? drawerPosition === 'right'
                : (direction === 'rtl' && drawerPosition !== 'right') ||
                  (direction !== 'rtl' && drawerPosition === 'right')
            )
              ? {
                  borderLeftColor: colors.border,
                  borderLeftWidth: StyleSheet.hairlineWidth,
                }
              : {
                  borderRightColor: colors.border,
                  borderRightWidth: StyleSheet.hairlineWidth,
                }),

          drawerType === 'front' &&
            (drawerPosition === 'left'
              ? {
                  borderTopRightRadius: DRAWER_BORDER_RADIUS,
                  borderBottomRightRadius: DRAWER_BORDER_RADIUS,
                }
              : {
                  borderTopLeftRadius: DRAWER_BORDER_RADIUS,
                  borderBottomLeftRadius: DRAWER_BORDER_RADIUS,
                }),
          drawerStyle,
        ]}
        overlayStyle={{ backgroundColor: overlayColor }}
        renderDrawerContent={renderDrawerContent}>
        {renderSceneContent()}
      </Drawer>
    </DrawerStatusContext.Provider>
  );
}

export function DrawerView(props: Props) {
  return (
    <SafeAreaProviderCompat>
      <DrawerViewBase {...props} />
    </SafeAreaProviderCompat>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
