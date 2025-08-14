import { EventMapBase, NavigationState } from '@react-navigation/native';
import React, {
  Children,
  forwardRef,
  ComponentProps,
  ComponentType,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  ReactNode,
  RefAttributes,
  useMemo,
} from 'react';

import { useContextKey } from '../Route';
import {
  isNativeTabTrigger,
  convertTabPropsToOptions,
} from '../native-tabs/NativeBottomTabs/NativeTabTrigger';
import { PickPartial } from '../types';
import { useSortedScreens, ScreenProps } from '../useScreens';
import { isProtectedReactElement, Protected } from '../views/Protected';
import { isScreen, Screen } from '../views/Screen';

export function useFilterScreenChildren(
  children: ReactNode,
  {
    isCustomNavigator,
    contextKey,
  }: {
    isCustomNavigator?: boolean;
    /** Used for sending developer hints */
    contextKey?: string;
  } = {}
) {
  return useMemo(() => {
    const customChildren: any[] = [];

    const screens: (ScreenProps & { name: string })[] = [];
    const protectedScreens = new Set<string>();

    function flattenChild(child: ReactNode, exclude = false) {
      if (isScreen(child, contextKey)) {
        if (exclude) {
          protectedScreens.add(child.props.name);
        } else {
          screens.push(child.props);
        }
        return;
      }

      if (isNativeTabTrigger(child, contextKey)) {
        if (exclude) {
          protectedScreens.add(child.props.name);
        } else {
          const options = convertTabPropsToOptions(child.props);
          if (options.hidden === false) {
            screens.push({
              ...child.props,
              options: convertTabPropsToOptions(child.props),
            });
          } else {
            // - hidden = undefined -> then the route was not specified in navigator
            // - hidden = true -> then the route is hidden
            // In this cases we should treat the tab as protected
            protectedScreens.add(child.props.name);
          }
        }
        return;
      }

      if (isProtectedReactElement(child)) {
        if (child.props.guard) {
          Children.forEach(child.props.children, (protectedChild) => flattenChild(protectedChild));
        } else {
          Children.forEach(child.props.children, (protectedChild) => {
            flattenChild(protectedChild, true);
          });
        }
        return;
      }

      if (isCustomNavigator) {
        customChildren.push(child);
        return null;
      }

      console.warn(
        `Layout children must be of type Screen, all other children are ignored. To use custom children, create a custom <Layout />. Update Layout Route at: "app${contextKey}/_layout"`
      );

      return null;
    }

    Children.forEach(children, (child) => flattenChild(child));

    // Add an assertion for development
    if (process.env.NODE_ENV !== 'production') {
      // Assert if names are not unique
      const names = screens?.map(
        (screen) => screen && typeof screen === 'object' && 'name' in screen && screen.name
      );
      if (names && new Set(names).size !== names.length) {
        throw new Error('Screen names must be unique: ' + names);
      }
    }

    return {
      screens,
      children: customChildren,
      protectedScreens,
    };
  }, [children]);
}

/**
 * Returns a navigator that automatically injects matched routes and renders nothing when there are no children.
 * Return type with `children` prop optional.
 * 
 * Enables use of other built-in React Navigation navigators and other navigators built with the React Navigation custom navigator API.
 *
 * @param Nav - The navigator component to wrap.
 * @param processor - A function that processes the screens before passing them to the navigator.
 * @param useOnlyUserDefinedScreens - If true, all screens not specified as navigator's children will be ignored.
 *
 *  @example
 * ```tsx app/_layout.tsx
 * import { ParamListBase, TabNavigationState } from "@react-navigation/native";
 * import {
 *   createMaterialTopTabNavigator,
 *   MaterialTopTabNavigationOptions,
 *   MaterialTopTabNavigationEventMap,
 * } from "@react-navigation/material-top-tabs";
 * import { withLayoutContext } from "expo-router";
 * 
 * const MaterialTopTabs = createMaterialTopTabNavigator();
 * 
 * const ExpoRouterMaterialTopTabs = withLayoutContext<
 *   MaterialTopTabNavigationOptions,
 *   typeof MaterialTopTabs.Navigator,
 *   TabNavigationState<ParamListBase>,
 *   MaterialTopTabNavigationEventMap
 * >(MaterialTopTabs.Navigator);

 * export default function TabLayout() {
 *   return <ExpoRouterMaterialTopTabs />;
 * }
 * ```
 */
export function withLayoutContext<
  TOptions extends object,
  T extends ComponentType<any>,
  TState extends NavigationState,
  TEventMap extends EventMapBase,
>(
  Nav: T,
  processor?: (options: ScreenProps[]) => ScreenProps[],
  useOnlyUserDefinedScreens: boolean = false
) {
  return Object.assign(
    forwardRef(({ children: userDefinedChildren, ...props }: any, ref) => {
      const contextKey = useContextKey();

      const { screens, protectedScreens } = useFilterScreenChildren(userDefinedChildren, {
        contextKey,
      });

      const processed = processor ? processor(screens ?? []) : screens;

      const sorted = useSortedScreens(processed ?? [], protectedScreens, useOnlyUserDefinedScreens);

      // Prevent throwing an error when there are no screens.
      if (!sorted.length) {
        return null;
      }

      return <Nav {...props} id={contextKey} ref={ref} children={sorted} />;
    }),
    {
      Screen,
      Protected,
    }
  ) as ForwardRefExoticComponent<
    PropsWithoutRef<PickPartial<ComponentProps<T>, 'children'>> & RefAttributes<unknown>
  > & {
    Screen: (props: ScreenProps<TOptions, TState, TEventMap>) => null;
    Protected: typeof Protected;
  };
}
