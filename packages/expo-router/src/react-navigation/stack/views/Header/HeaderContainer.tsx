'use client';
import { use } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Header } from './Header';
import { getHeaderTitle, HeaderBackContext } from '../../../elements';
import {
  NavigationProvider,
  type ParamListBase,
  type Route,
  useLinkBuilder,
} from '../../../native';
import {
  forNoAnimation,
  forSlideLeft,
  forSlideRight,
  forSlideUp,
} from '../../TransitionConfigs/HeaderStyleInterpolators';
import type {
  Layout,
  Scene,
  StackHeaderMode,
  StackHeaderProps,
  StackNavigationProp,
} from '../../types';

export type Props = {
  mode: StackHeaderMode;
  layout: Layout;
  scenes: (Scene | undefined)[];
  getPreviousScene: (props: { route: Route<string> }) => Scene | undefined;
  getFocusedRoute: () => Route<string>;
  onContentHeightChange?: (props: { route: Route<string>; height: number }) => void;
  style?: StyleProp<ViewStyle>;
};

export function HeaderContainer({
  mode,
  scenes,
  layout,
  getPreviousScene,
  getFocusedRoute,
  onContentHeightChange,
  style,
}: Props) {
  const focusedRoute = getFocusedRoute();
  const parentHeaderBack = use(HeaderBackContext);
  const { buildHref } = useLinkBuilder();

  return (
    <View style={[styles.boxNone, style]}>
      {/* We render header only on two top-most headers as
         a workaround for https://github.com/react-navigation/react-navigation/issues/12456.
         If the header is persisted, it might be placed incorrectly when navigating back. */}
      {scenes.slice(-2).map((scene, i, self) => {
        if ((mode === 'screen' && i !== self.length - 1) || !scene) {
          return null;
        }

        const {
          header,
          headerMode,
          headerShown = true,
          headerTransparent,
          headerStyleInterpolator,
        } = scene.descriptor.options;

        if (headerMode !== mode || !headerShown) {
          return null;
        }

        const isFocused = focusedRoute.key === scene.descriptor.route.key;
        const previousScene = getPreviousScene({
          route: scene.descriptor.route,
        });

        let headerBack = parentHeaderBack;

        if (previousScene) {
          const { options, route } = previousScene.descriptor;

          headerBack = previousScene
            ? {
                title: getHeaderTitle(options, route.name),
                href: buildHref(route.name, route.params),
              }
            : parentHeaderBack;
        }

        // If the screen is next to a headerless screen, we need to make the header appear static
        // This makes the header look like it's moving with the screen
        const previousDescriptor = self[i - 1]?.descriptor;
        const nextDescriptor = self[i + 1]?.descriptor;

        const { headerShown: previousHeaderShown = true, headerMode: previousHeaderMode } =
          previousDescriptor?.options || {};

        // If any of the next screens don't have a header or header is part of the screen
        // Then we need to move this header offscreen so that it doesn't cover it
        const nextHeaderlessScene = self.slice(i + 1).find((scene) => {
          const { headerShown: currentHeaderShown = true, headerMode: currentHeaderMode } =
            scene?.descriptor.options || {};

          return currentHeaderShown === false || currentHeaderMode === 'screen';
        });

        const { gestureDirection: nextHeaderlessGestureDirection } =
          nextHeaderlessScene?.descriptor.options || {};

        const isHeaderStatic =
          ((previousHeaderShown === false || previousHeaderMode === 'screen') &&
            // We still need to animate when coming back from next scene
            // A hacky way to check this is if the next scene exists
            !nextDescriptor) ||
          nextHeaderlessScene;

        const props: StackHeaderProps = {
          layout,
          back: headerBack,
          progress: scene.progress,
          options: scene.descriptor.options,
          route: scene.descriptor.route,
          navigation: scene.descriptor.navigation as StackNavigationProp<ParamListBase>,
          styleInterpolator:
            mode === 'float'
              ? isHeaderStatic
                ? nextHeaderlessGestureDirection === 'vertical' ||
                  nextHeaderlessGestureDirection === 'vertical-inverted'
                  ? forSlideUp
                  : nextHeaderlessGestureDirection === 'horizontal-inverted'
                    ? forSlideRight
                    : forSlideLeft
                : headerStyleInterpolator
              : forNoAnimation,
        };

        return (
          <NavigationProvider
            key={scene.descriptor.route.key}
            route={scene.descriptor.route}
            navigation={scene.descriptor.navigation}>
            <View
              onLayout={
                onContentHeightChange
                  ? (e) => {
                      const { height } = e.nativeEvent.layout;

                      onContentHeightChange({
                        route: scene.descriptor.route,
                        height,
                      });
                    }
                  : undefined
              }
              aria-hidden={!isFocused}
              style={[
                {
                  pointerEvents: isFocused ? 'box-none' : 'none',
                }, // Avoid positioning the focused header absolutely
                // Otherwise accessibility tools don't seem to be able to find it
                (mode === 'float' && !isFocused) || headerTransparent ? styles.header : null,
              ]}>
              {header !== undefined ? header(props) : <Header {...props} />}
            </View>
          </NavigationProvider>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  boxNone: {
    pointerEvents: 'box-none',
  },
  header: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
  },
});
