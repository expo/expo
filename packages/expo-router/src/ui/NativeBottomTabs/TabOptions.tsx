import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { isValidElement } from 'react';

import type { NativeTabOptions } from './NativeTabsView';
import { AndroidIcon, Badge, Icon, IOSIcon, Title } from './NavigatorElements';
import { filterAllowedChildrenElements, isChildOfType } from './utils';

export type TabProps = PropsWithChildren<{
  name: string;
  hidden?: boolean;
  options?: Omit<NativeTabOptions, 'hidden' | 'specialEffects'>;
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
        if (acc.icon && 'sfSymbolName' in acc.icon) {
          // This is forbidden by screens
          throw new Error('You can only use one type of icon (Icon or IOSIcon) for a single tab');
        }
        if ('useAsSelected' in child.props && child.props.useAsSelected) {
          acc.selectedIcon = icon;
        } else {
          acc.icon = icon;
        }
      } else if (isChildOfType(child, IOSIcon) && process.env.EXPO_OS === 'ios') {
        const icon: NativeTabOptions['icon'] = {
          sfSymbolName: child.props.name,
        };
        if (acc.icon && 'imageSource' in acc.icon) {
          // This is forbidden by screens
          throw new Error('You can only use one type of icon (Icon or IOSIcon) for a single tab');
        }
        if ('useAsSelected' in child.props && child.props.useAsSelected) {
          acc.selectedIcon = icon;
        } else {
          acc.icon = icon;
        }
      } else if (isChildOfType(child, AndroidIcon) && process.env.EXPO_OS === 'android') {
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
