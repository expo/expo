import type { JSXElementConstructor, PropsWithChildren, ReactElement, ReactNode } from 'react';
import React, { isValidElement } from 'react';

import type { NativeTabOptions } from './NativeTabsView';
import { AndroidIcon, Badge, Icon, IOSIcon, Title } from './NavigatorElements';

export type TabProps = PropsWithChildren<{
  name: string;
  hidden?: boolean;
  options?: NativeTabOptions;
  popToRoot?: boolean;
  disableScrollToTop?: boolean;
}>;

export function Tab(props: TabProps) {
  return null;
}

export function convertTabPropsToOptions({
  options,
  hidden,
  children,
  popToRoot,
  disableScrollToTop,
}: TabProps) {
  const initialOptions: NativeTabOptions = {
    ...options,
    hidden: !!hidden,
    specialEffects: {
      repeatedTabSelection: {
        popToRoot: !!popToRoot,
        scrollToTop: !disableScrollToTop,
      },
    },
  };
  const allowedChildren = filterAllowedChildrenElements(children, [
    Badge,
    Title,
    Icon,
    IOSIcon,
    AndroidIcon,
  ]);
  return allowedChildren.reduce<NativeTabOptions>(
    (acc, child) => {
      if (isChildOfType(child, Badge)) {
        if (child.props.children) {
          acc.badgeValue = String(child.props.children);
        }
        // if (child.props.style?.backgroundColor) {
        //   acc.tabBarItemBadgeBackgroundColor = child.props.style.backgroundColor;
        // }
      } else if (isChildOfType(child, Title)) {
        acc.title = child.props.children;
      } else if (isChildOfType(child, Icon)) {
        const icon: NativeTabOptions['icon'] = {
          imageSource: child.props.src,
        };
        if ('useAsSelected' in child.props && child.props.useAsSelected) {
          acc.selectedIcon = icon;
        } else {
          acc.icon = icon;
        }
      } else if (isChildOfType(child, IOSIcon) && process.env.EXPO_OS === 'ios') {
        const icon: NativeTabOptions['icon'] = {
          sfSymbolName: child.props.name,
        };
        if ('useAsSelected' in child.props && child.props.useAsSelected) {
          acc.selectedIcon = icon;
        } else {
          console.log('Icon', icon);
          acc.icon = icon;
        }
      } else if (isChildOfType(child, AndroidIcon)) {
        acc.iconResourceName = child.props.name;
      }
      return acc;
    },
    { ...initialOptions }
  );
}

export function isTab(
  child: ReactNode,
  contextKey?: string
): child is ReactElement<TabProps & { name: string }> {
  if (isValidElement(child) && child && child.type === Tab) {
    if (
      typeof child.props === 'object' &&
      child.props &&
      'name' in child.props &&
      !child.props.name
    ) {
      throw new Error(
        `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      if (
        ['component', 'getComponent'].some(
          (key) => child.props && typeof child.props === 'object' && key in child.props
        )
      ) {
        throw new Error(
          `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`component\` or \`getComponent\` prop when used as a child of a Layout Route`
        );
      }
    }

    return true;
  }

  return false;
}

function filterAllowedChildrenElements<Components extends JSXElementConstructor<any>[]>(
  children: ReactNode | ReactNode[],
  components: Components
): React.ReactElement<React.ComponentProps<Components[number]>, Components[number]>[] {
  return React.Children.toArray(children).filter(
    (
      child
    ): child is React.ReactElement<React.ComponentProps<Components[number]>, Components[number]> =>
      React.isValidElement(child) && components.includes(child.type as (props: any) => ReactNode)
  );
}

function isChildOfType<T extends JSXElementConstructor<any>>(
  child: ReactNode,
  type: T
): child is React.ReactElement<React.ComponentProps<T>, T> {
  return React.isValidElement(child) && child.type === type;
}
