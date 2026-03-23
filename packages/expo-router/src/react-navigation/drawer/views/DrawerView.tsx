import {
  getHeaderTitle,
  Header,
  SafeAreaProviderCompat,
  Screen,
  useFrameSize,
} from '@react-navigation/elements';
import {
  DrawerActions,
  type DrawerNavigationState,
  type DrawerStatus,
  type ParamListBase,
  StackActions,
  useLocale,
  useTheme,
} from '@react-navigation/native';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import useLatestCallback from 'use-latest-callback';

import type {
  DrawerContentComponentProps,
  DrawerDescriptorMap,
  DrawerHeaderProps,
  DrawerNavigationConfig,
  DrawerNavigationHelpers,
  DrawerNavigationProp,
} from '../types';
import { addCancelListener } from '../utils/addCancelListener';
import { DrawerPositionContext } from '../utils/DrawerPositionContext';
import { DrawerStatusContext } from '../utils/DrawerStatusContext';
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

  const focusedRouteKey = state.routes[state.index].key;
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
    swipeEnabled = Platform.OS !== 'web' &&
      Platform.OS !== 'windows' &&
      Platform.OS !== 'macos',
    swipeMinDistance,
    overlayAccessibilityLabel,
  } = descriptors[focusedRouteKey].options;

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
      const prevRoute = state.routes.find(
        (route) => route.key === previousRouteKey
      );

      if (prevRoute?.state?.type === 'stack' && prevRoute.state.key) {
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

  const drawerStatus = getDrawerStatusFromState(state);

  const handleDrawerOpen = useLatestCallback(() => {
    navigation.dispatch({
      ...DrawerActions.openDrawer(),
      target: state.key,
    });
  });

  const handleDrawerClose = useLatestCallback(() => {
    navigation.dispatch({
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
  }, [
    defaultStatus,
    drawerStatus,
    drawerType,
    handleDrawerClose,
    handleDrawerOpen,
    navigation,
  ]);

  const renderDrawerContent = () => {
    return (
      <DrawerPositionContext.Provider value={drawerPosition}>
        {drawerContent({
          state: state,
          navigation: navigation,
          descriptors: descriptors,
        })}
      </DrawerPositionContext.Provider>
    );
  };

  const renderSceneContent = () => {
    return (
      <MaybeScreenContainer
        enabled={detachInactiveScreens}
        hasTwoStates
        style={styles.content}
      >
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const { lazy = true } = descriptor.options;
          const isFocused = state.index === index;
          const isPreloaded = state.preloadedRouteKeys.includes(route.key);

          if (
            lazy &&
            !loaded.includes(route.key) &&
            !isFocused &&
            !isPreloaded
          ) {
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
              style={[StyleSheet.absoluteFill, { zIndex: isFocused ? 0 : -1 }]}
              visible={isFocused}
              enabled={detachInactiveScreens}
              freezeOnBlur={freezeOnBlur}
              shouldFreeze={!isFocused && !isPreloaded}
            >
              <Screen
                focused={isFocused}
                route={descriptor.route}
                navigation={descriptor.navigation}
                headerShown={headerShown}
                headerStatusBarHeight={headerStatusBarHeight}
                headerTransparent={headerTransparent}
                header={header({
                  layout: dimensions,
                  route: descriptor.route,
                  navigation:
                    descriptor.navigation as DrawerNavigationProp<ParamListBase>,
                  options: descriptor.options,
                })}
                style={sceneStyle}
              >
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
        renderDrawerContent={renderDrawerContent}
      >
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
