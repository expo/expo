'use client';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';

import useLatestCallback from '../../../utils/useLatestCallback';
import {
  getHeaderTitle,
  Header,
  SafeAreaProviderCompat,
  Screen,
  useFrameSize,
} from '../../elements';
import {
  DrawerActions,
  type DrawerNavigationState,
  type DrawerStatus,
  type ParamListBase,
  StackActions,
  useLocale,
  useTheme,
} from '../../native';
import type {
  DrawerContentComponentProps,
  DrawerDescriptorMap,
  DrawerHeaderProps,
  DrawerNavigationConfig,
  DrawerNavigationHelpers,
  DrawerNavigationProp,
} from '../types';
import { DrawerPositionContext } from '../utils/DrawerPositionContext';
import { DrawerStatusContext } from '../utils/DrawerStatusContext';
import { addCancelListener } from '../utils/addCancelListener';
import { getDrawerStatusFromState } from '../utils/getDrawerStatusFromState';
import { DrawerContent } from './DrawerContent';
import { DrawerToggleButton } from './DrawerToggleButton';
import { MaybeScreen, MaybeScreenContainer } from './ScreenFallback';

type Props = DrawerNavigationConfig & {
  defaultStatus: DrawerStatus;
  state: DrawerNavigationState<ParamListBase>;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
};

const DRAWER_BORDER_RADIUS = 16;

const renderDrawerContentDefault = (props: DrawerContentComponentProps) => (
  <DrawerContent {...props} />
);

function DrawerViewBase({
  state,
  navigation,
  descriptors,
  defaultStatus,
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

  // Keys of routes that have been focused during this mount. Only blurred routes from this list are
  // frozen, so a route is never frozen before it has rendered once.
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
      const prevRoute = state.routes.find((route) => route.key === previousRouteKey);

      if (prevRoute?.state?.key) {
        // A targeted POP_TO_TOP is a no-op for nested navigators that are not stacks.
        navigation.dispatch({
          ...StackActions.popToTop(),
          target: prevRoute.state.key,
        });
      }
    }

    previousRouteKeyRef.current = focusedRouteKey;
  }, [descriptors, focusedRouteKey, navigation, state.routes]);

  const dimensions = useFrameSize((size) => size, true);

  const { colors } = useTheme();

  const drawerStatus = getDrawerStatusFromState(state, defaultStatus);

  const handleDrawerOpen = useLatestCallback(() => {
    navigation.dispatchSync({
      ...DrawerActions.openDrawer(),
      target: state.key,
    });
  });

  const handleDrawerClose = useLatestCallback(() => {
    navigation.dispatchSync({
      ...DrawerActions.closeDrawer(),
      target: state.key,
    });
  });

  const handleGestureStart = useLatestCallback(() => {
    navigation.emit({
      type: 'gestureStart',
      target: state.key,
    });
  });

  const handleGestureEnd = useLatestCallback(() => {
    navigation.emit({
      type: 'gestureEnd',
      target: state.key,
    });
  });

  const handleGestureCancel = useLatestCallback(() => {
    navigation.emit({
      type: 'gestureCancel',
      target: state.key,
    });
  });

  const handleTransitionStart = useLatestCallback((closing: boolean) => {
    navigation.emit({
      type: 'transitionStart',
      data: { closing },
      target: state.key,
    });
  });

  const handleTransitionEnd = useLatestCallback((closing: boolean) => {
    navigation.emit({
      type: 'transitionEnd',
      data: { closing },
      target: state.key,
    });
  });

  React.useEffect(() => {
    if (drawerStatus === defaultStatus || drawerType === 'permanent') {
      return;
    }

    const handleHardwareBack = () => {
      // We shouldn't handle the back button if the parent screen isn't focused
      // This will avoid the drawer overriding event listeners from a focused screen
      if (!navigation.isFocused()) {
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
  }, [defaultStatus, drawerStatus, drawerType, handleDrawerClose, handleDrawerOpen, navigation]);

  const renderDrawerContent = () => {
    return (
      <DrawerPositionContext.Provider value={drawerPosition}>
        {drawerContent({
          state,
          navigation,
          descriptors,
        })}
      </DrawerPositionContext.Provider>
    );
  };

  const renderSceneContent = () => {
    return (
      <MaybeScreenContainer enabled={detachInactiveScreens} hasTwoStates style={styles.content}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key]!;
          const isFocused = state.index === index;

          if (descriptor.route.key === undefined) {
            // Don't render placeholder screens.
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
              style={[StyleSheet.absoluteFill, { zIndex: isFocused ? 0 : -1 }]}
              visible={isFocused}
              enabled={detachInactiveScreens}
              freezeOnBlur={freezeOnBlur}
              // TODO: A visited blurred route re-preloaded with new params stays frozen until focused.
              shouldFreeze={!isFocused && loaded.includes(route.key)}>
              <Screen
                focused={isFocused}
                route={route}
                navigation={descriptor.navigation}
                headerShown={headerShown}
                headerStatusBarHeight={headerStatusBarHeight}
                headerTransparent={headerTransparent}
                header={header({
                  layout: dimensions,
                  route,
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

export function DrawerView({ navigation, ...rest }: Props) {
  return (
    <SafeAreaProviderCompat>
      <DrawerViewBase navigation={navigation} {...rest} />
    </SafeAreaProviderCompat>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
