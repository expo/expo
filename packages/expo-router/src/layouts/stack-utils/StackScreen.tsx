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

export function StackScreen({ children, options, ...rest }: StackScreenProps) {
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
}

StackScreen.Title = StackScreenTitle;
StackScreen.BackButton = StackScreenBackButton;

export function appendScreenStackPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackScreenProps
): NativeStackNavigationOptions {
  let updatedOptions = { ...options, ...props.options };

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
          `Stack.Toolbar with placement="bottom" cannot be used inside Stack.Screen in _layout.tsx. Please move it to the page component.`
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
