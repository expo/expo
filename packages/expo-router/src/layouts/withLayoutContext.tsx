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
  isValidElement,
  useMemo,
} from 'react';

import { useContextKey } from '../Route';
import { PickPartial } from '../types';
import { useSortedScreens, ScreenProps } from '../useScreens';
import { Screen } from '../views/Screen';

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
    const screens = Children.map(children, (child) => {
      if (isValidElement(child) && child && child.type === Screen) {
        if (!child.props.name) {
          throw new Error(
            `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`
          );
        }
        if (process.env.NODE_ENV !== 'production') {
          if (['children', 'component', 'getComponent'].some((key) => key in child.props)) {
            throw new Error(
              `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`children\`, \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`
            );
          }
        }
        return child.props;
      } else {
        if (isCustomNavigator) {
          customChildren.push(child);
        } else {
          console.warn(
            `Layout children must be of type Screen, all other children are ignored. To use custom children, create a custom <Layout />. Update Layout Route at: "app${contextKey}/_layout"`
          );
        }
      }
    });

    // Add an assertion for development
    if (process.env.NODE_ENV !== 'production') {
      // Assert if names are not unique
      const names = screens?.map((screen) => screen.name);
      if (names && new Set(names).size !== names.length) {
        throw new Error('Screen names must be unique: ' + names);
      }
    }

    return {
      screens,
      children: customChildren,
    };
  }, [children]);
}

/** Return a navigator that automatically injects matched routes and renders nothing when there are no children. Return type with children prop optional */
export function withLayoutContext<
  TOptions extends object,
  T extends ComponentType<any>,
  TState extends NavigationState,
  TEventMap extends EventMapBase,
>(
  Nav: T,
  processor?: (
    options: ScreenProps<TOptions, TState, TEventMap>[]
  ) => ScreenProps<TOptions, TState, TEventMap>[]
): ForwardRefExoticComponent<
  PropsWithoutRef<PickPartial<ComponentProps<T>, 'children'>> & RefAttributes<unknown>
> & {
  Screen: (props: ScreenProps<TOptions, TState, TEventMap>) => null;
} {
  const Navigator = forwardRef<unknown, PropsWithoutRef<ComponentProps<T>>>(
    ({ children: userDefinedChildren, ...props }, ref) => {
      const contextKey = useContextKey();

      const { screens } = useFilterScreenChildren(userDefinedChildren, {
        contextKey,
      });

      const processed = processor ? processor(screens ?? []) : screens;

      const sorted = useSortedScreens(processed ?? []);

      // Prevent throwing an error when there are no screens.
      if (!sorted.length) {
        return null;
      }

      // @ts-expect-error
      return <Nav {...props} id={contextKey} ref={ref} children={sorted} />;
    }
  );

  // @ts-expect-error
  Navigator.Screen = Screen;
  // @ts-expect-error
  return Navigator;
}
