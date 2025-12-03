import { Box, fillMaxSize, Host, NavigationDrawer } from '@expo/ui/jetpack-compose';
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
} from '@react-navigation/native';
import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import type {
  DrawerContentComponentProps,
  DrawerDescriptorMap,
  DrawerHeaderProps,
  DrawerNavigationConfig,
  DrawerNavigationHelpers,
  DrawerNavigationProp,
} from '../types';
import { DrawerItemList } from './DrawerItemList';
import { DrawerToggleButton } from './DrawerToggleButton';
import { MaybeScreen, MaybeScreenContainer } from './ScreenFallback';
import { DrawerPositionContext } from '../utils/DrawerPositionContext';
import { DrawerStatusContext } from '../utils/DrawerStatusContext';
import { getDrawerStatusFromState } from '../utils/getDrawerStatusFromState';

type Props = DrawerNavigationConfig & {
  defaultStatus: DrawerStatus;
  state: DrawerNavigationState<ParamListBase>;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
};

export function DrawerContent({ descriptors, state, ...rest }: DrawerContentComponentProps) {
  // const focusedRoute = state.routes[state.index];
  // const focusedDescriptor = descriptors[focusedRoute.key];
  // const focusedOptions = focusedDescriptor.options;

  // const { drawerContentStyle, drawerContentContainerStyle } = focusedOptions;

  return (
    // <DrawerContentScrollView
    //   {...rest}
    //   contentContainerStyle={drawerContentContainerStyle}
    //   style={drawerContentStyle}>
    <DrawerItemList descriptors={descriptors} state={state} {...rest} />
    // </DrawerContentScrollView>
  );
}

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
  // const { direction } = useLocale();

  const focusedRouteKey = state.routes[state.index].key;
  const { drawerPosition } = descriptors[focusedRouteKey].options;

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

  // const { colors } = useTheme();

  const drawerStatus = getDrawerStatusFromState(state);

  // const handleDrawerOpen = useLatestCallback(() => {
  //   navigation.dispatch({
  //     ...DrawerActions.openDrawer(),
  //     target: state.key,
  //   });
  // });

  // const handleDrawerClose = useLatestCallback(() => {
  //   navigation.dispatch({
  //     ...DrawerActions.closeDrawer(),
  //     target: state.key,
  //   });
  // });

  // const handleGestureStart = useLatestCallback(() => {
  //   navigation.emit({
  //     type: 'gestureStart',
  //     target: state.key,
  //   });
  // });

  // const handleGestureEnd = useLatestCallback(() => {
  //   navigation.emit({
  //     type: 'gestureEnd',
  //     target: state.key,
  //   });
  // });

  // const handleGestureCancel = useLatestCallback(() => {
  //   navigation.emit({
  //     type: 'gestureCancel',
  //     target: state.key,
  //   });
  // });

  // const handleTransitionStart = useLatestCallback((closing: boolean) => {
  //   navigation.emit({
  //     type: 'transitionStart',
  //     data: { closing },
  //     target: state.key,
  //   });
  // });

  // const handleTransitionEnd = useLatestCallback((closing: boolean) => {
  //   navigation.emit({
  //     type: 'transitionEnd',
  //     data: { closing },
  //     target: state.key,
  //   });
  // });

  // React.useEffect(() => {
  //   if (drawerStatus === defaultStatus || drawerType === 'permanent') {
  //     return;
  //   }

  //   const handleHardwareBack = () => {
  //     // We shouldn't handle the back button if the parent screen isn't focused
  //     // This will avoid the drawer overriding event listeners from a focused screen
  //     if (!navigation.isFocused()) {
  //       return false;
  //     }

  //     if (defaultStatus === 'open') {
  //       handleDrawerOpen();
  //     } else {
  //       handleDrawerClose();
  //     }

  //     return true;
  //   };

  //   // We only add the listeners when drawer opens
  //   // This way we can make sure that the listener is added as late as possible
  //   // This will make sure that our handler will run first when back button is pressed
  //   return addCancelListener(handleHardwareBack);
  // }, [defaultStatus, drawerStatus, drawerType, handleDrawerClose, handleDrawerOpen, navigation]);

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
          const descriptor = descriptors[route.key];
          const { lazy = true } = descriptor.options;
          const isFocused = state.index === index;
          const isPreloaded = state.preloadedRouteKeys.includes(route.key);

          if (lazy && !loaded.includes(route.key) && !isFocused && !isPreloaded) {
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
              shouldFreeze={!isFocused && !isPreloaded}>
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
      <Host style={{ flex: 1 }}>
        <NavigationDrawer
          enabled={drawerStatus !== 'closed'}
          onDrawerStateChange={(enabled) => {
            if (enabled) {
              navigation.dispatch({
                ...DrawerActions.openDrawer(),
                target: state.key,
              });
            } else {
              navigation.dispatch({
                ...DrawerActions.closeDrawer(),
                target: state.key,
              });
            }
          }}
          modifiers={[fillMaxSize()]}>
          {/* <Drawer
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
        renderDrawerContent={renderDrawerContent}> */}
          <Box modifiers={[fillMaxSize()]}>{renderDrawerContent()}</Box>
          {/* move to RNHost, fill content */}

          <View style={{ width: dimensions.width, height: dimensions.height }}>
            {renderSceneContent()}
          </View>

          {/* </Drawer>*/}
        </NavigationDrawer>
      </Host>
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
