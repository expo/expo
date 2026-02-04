'use client';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Children, isValidElement, useMemo, type PropsWithChildren, type ReactNode } from 'react';

import { StackHeaderComponent, appendStackHeaderPropsToOptions } from './StackHeaderComponent';
import {
  StackScreenTitle,
  appendStackScreenTitlePropsToOptions,
  StackScreenBackButton,
  appendStackScreenBackButtonPropsToOptions,
} from './screen';
import { StackToolbar, appendStackToolbarPropsToOptions, type StackToolbarProps } from './toolbar';
import { getAllChildrenOfType, isChildOfType } from '../../utils/children';
import { Screen } from '../../views/Screen';

export interface StackScreenProps extends PropsWithChildren {
  name?: string;
  options?: NativeStackNavigationOptions;
}

function extractBottomToolbars(children: ReactNode): React.ReactElement<StackToolbarProps>[] {
  return (
    getAllChildrenOfType(children, StackToolbar).filter(
      (child) => child.props.placement === 'bottom' || child.props.placement === undefined
    ) ?? []
  );
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
    const updatedOptions = useMemo(
      () =>
        appendScreenStackPropsToOptions(options ?? {}, {
          children,
        }),
      [options, children]
    );

    const bottomToolbars = useMemo(() => extractBottomToolbars(children), [children]);

    return (
      <>
        <Screen {...rest} options={updatedOptions} />
        {/* Bottom toolbar is a native component rendered separately */}
        {bottomToolbars}
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
