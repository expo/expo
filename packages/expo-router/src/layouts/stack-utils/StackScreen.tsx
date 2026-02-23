'use client';
import type { ParamListBase, StackNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationEventMap } from '@react-navigation/native-stack';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Children, isValidElement, useMemo, type PropsWithChildren } from 'react';

import { StackHeaderComponent, appendStackHeaderPropsToOptions } from './StackHeaderComponent';
import {
  StackScreenTitle,
  appendStackScreenTitlePropsToOptions,
  StackScreenBackButton,
  appendStackScreenBackButtonPropsToOptions,
} from './screen';
import { StackToolbar, appendStackToolbarPropsToOptions } from './toolbar';
import type { ScreenProps as BaseScreenProps } from '../../useScreens';
import { isChildOfType } from '../../utils/children';
import { Screen } from '../../views/Screen';

type StackBaseScreenProps = BaseScreenProps<
  NativeStackNavigationOptions,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>;

export interface StackScreenProps extends PropsWithChildren {
  /** Name is required when used inside a Layout component. */
  name?: StackBaseScreenProps['name'];

  /**
   * Options to configure the screen.
   *
   * Accepts an object or a function returning an object.
   * The function form `options={({ route }) => ({})}` is only supported when used inside a Layout component.
   * When used inside a page component, pass an options object directly.
   */
  options?: StackBaseScreenProps['options'];

  /**
   * Redirect to the nearest sibling route.
   * If all children are `redirect={true}`, the layout will render `null` as there are no children to render.
   *
   * Only supported when used inside a Layout component.
   */
  redirect?: StackBaseScreenProps['redirect'];

  /**
   * Initial params to pass to the route.
   *
   * Only supported when used inside a Layout component.
   */
  initialParams?: StackBaseScreenProps['initialParams'];

  /**
   * Listeners for navigation events.
   *
   * Only supported when used inside a Layout component.
   */
  listeners?: StackBaseScreenProps['listeners'];

  /**
   * Function to determine a unique ID for the screen.
   * @deprecated Use `dangerouslySingular` instead.
   *
   * Only supported when used inside a Layout component.
   */
  getId?: StackBaseScreenProps['getId'];

  /**
   * When enabled, the navigator will reuse an existing screen instead of pushing a new one.
   *
   * Only supported when used inside a Layout component.
   */
  dangerouslySingular?: StackBaseScreenProps['dangerouslySingular'];
}

/**
 * Component used to define a screen in a native stack navigator.
 *
 * Can be used in the `_layout.tsx` files, or directly in page components.
 *
 * When configuring header inside page components, prefer using `Stack.Toolbar`, `Stack.Header` and `Stack.Screen.*` components.
 *
 * @example
 * ```tsx app/_layout.tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen
 *         name="home"
 *         options={{ title: 'Home' }}
 *       />
 *    </Stack>
 *  );
 * }
 * ```
 *
 * @example
 * ```tsx app/home.tsx
 * import { Stack } from 'expo-router';
 *
 * export default function HomePage() {
 *   return (
 *     <>
 *       <Stack.Screen
 *         options={{ headerTransparent: true }}
 *       />
 *       <Stack.Screen.Title>Welcome Home</Stack.Screen.Title>
 *       // Page content
 *     </>
 *   );
 * }
 * ```
 */
export const StackScreen = Object.assign(
  function StackScreen({ children, options, ...rest }: StackScreenProps) {
    // This component will only render when used inside a page.
    if (process.env.NODE_ENV !== 'production' && typeof options === 'function') {
      console.warn(
        'Stack.Screen: Function-form options are not supported inside page components. Pass an options object directly.'
      );
    }

    const ownOptions = useMemo(
      () => validateStackPresentation(typeof options === 'function' ? {} : (options ?? {})),
      [options]
    );

    return (
      <>
        <Screen {...rest} options={ownOptions} />
        {children}
      </>
    );
  },
  {
    Title: StackScreenTitle,
    BackButton: StackScreenBackButton,
  }
);

const VALID_PRESENTATIONS = [
  'card',
  'modal',
  'transparentModal',
  'containedModal',
  'containedTransparentModal',
  'fullScreenModal',
  'formSheet',
  'pageSheet',
] as const;

export function validateStackPresentation(
  options: NativeStackNavigationOptions
): NativeStackNavigationOptions;
export function validateStackPresentation<
  F extends (...args: never[]) => NativeStackNavigationOptions,
>(options: F): F;
export function validateStackPresentation(
  options: NativeStackNavigationOptions | ((...args: never[]) => NativeStackNavigationOptions)
): ((...args: never[]) => NativeStackNavigationOptions) | NativeStackNavigationOptions {
  if (typeof options === 'function') {
    return (...args: never[]) => {
      const resolved = options(...args);
      validateStackPresentation(resolved);
      return resolved;
    };
  }

  const presentation = options.presentation;
  if (
    presentation &&
    !VALID_PRESENTATIONS.includes(presentation as (typeof VALID_PRESENTATIONS)[number])
  ) {
    throw new Error(
      `Invalid presentation value "${presentation}" passed to Stack.Screen. Valid values are: ${VALID_PRESENTATIONS.map((v) => `"${v}"`).join(', ')}.`
    );
  }
  return options;
}

export function appendScreenStackPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackScreenProps
): NativeStackNavigationOptions {
  let updatedOptions = { ...options, ...props.options };

  validateStackPresentation(updatedOptions);

  function appendChildOptions(child: React.ReactElement, opts: NativeStackNavigationOptions) {
    if (isChildOfType(child, StackHeaderComponent)) {
      return appendStackHeaderPropsToOptions(opts, child.props);
    }

    if (isChildOfType(child, StackScreenTitle)) {
      return appendStackScreenTitlePropsToOptions(opts, child.props);
    }

    if (isChildOfType(child, StackScreenBackButton)) {
      return appendStackScreenBackButtonPropsToOptions(opts, child.props);
    }

    if (isChildOfType(child, StackToolbar)) {
      const placement = child.props.placement ?? 'bottom';

      if (placement === 'bottom') {
        throw new Error(
          `Stack.Toolbar with placement="bottom" cannot be used inside Stack.Screen.`
        );
      }

      return appendStackToolbarPropsToOptions(opts, child.props);
    }

    const typeName =
      typeof child.type === 'function'
        ? (child.type as { name?: string }).name || 'Unknown'
        : String(child.type);
    console.warn(`Unknown child element passed to Stack.Screen: ${typeName}`);
    return opts;
  }

  Children.forEach(props.children, (child) => {
    if (isValidElement(child)) {
      updatedOptions = appendChildOptions(child, updatedOptions);
    }
  });

  return updatedOptions;
}
