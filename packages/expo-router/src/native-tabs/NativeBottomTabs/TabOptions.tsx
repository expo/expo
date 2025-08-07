'use client';

import type { PropsWithChildren, ReactElement, ReactNode } from 'react';
import { isValidElement } from 'react';

import type { NativeTabOptions } from './NativeTabsView';
import { filterAllowedChildrenElements, isChildOfType } from './utils';
import { Icon, Badge, Label } from '../common/elements';

export type TabProps = PropsWithChildren<{
  name: string;
  /**
   * If true, the tab will be hidden from the tab bar.
   */
  hidden?: boolean;
  /**
   * The options for the tab.
   */
  options?: Omit<NativeTabOptions, 'hidden' | 'specialEffects'>;
  /**
   * If true, the tab will not pop stack to the root when selected again.
   * @default false
   *
   * @platform ios
   */
  disablePopToTop?: boolean;
  /**
   * If true, the tab will not scroll to the top when selected again.
   * @default false
   *
   * @platform ios
   */
  disableScrollToTop?: boolean;
}>;

export function TabTrigger(props: TabProps) {
  return null;
}

export function convertTabPropsToOptions({
  options,
  hidden,
  children,
  disablePopToTop,
  disableScrollToTop,
}: TabProps) {
  const initialOptions: NativeTabOptions = {
    ...options,
    hidden: !!hidden,
    specialEffects: {
      repeatedTabSelection: {
        popToRoot: !disablePopToTop,
        scrollToTop: !disableScrollToTop,
      },
    },
  };
  const allowedChildren = filterAllowedChildrenElements(children, [Badge, Label, Icon]);
  return allowedChildren.reduce<NativeTabOptions>(
    (acc, child) => {
      if (isChildOfType(child, Badge)) {
        if (child.props.children) {
          acc.badgeValue = String(child.props.children);
        }
      } else if (isChildOfType(child, Label)) {
        acc.title = child.props.children;
      } else if (isChildOfType(child, Icon)) {
        if ('src' in child.props || 'selectedSrc' in child.props) {
          acc.icon = child.props.src
            ? {
                src: child.props.src,
              }
            : undefined;
          acc.selectedIcon = child.props.selectedSrc
            ? {
                src: child.props.selectedSrc,
              }
            : undefined;
        } else if ('sf' in child.props || 'selectedSf' in child.props) {
          if (process.env.EXPO_OS === 'ios') {
            acc.icon = child.props.sf
              ? {
                  sf: child.props.sf,
                }
              : undefined;
            acc.selectedIcon = child.props.selectedSf
              ? {
                  sf: child.props.selectedSf,
                }
              : undefined;
          }
        }
        if (process.env.EXPO_OS === 'android') {
          acc.icon = { drawable: child.props.drawable };
          acc.selectedIcon = undefined;
        }
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
  if (isValidElement(child) && child && child.type === TabTrigger) {
    if (
      typeof child.props === 'object' &&
      child.props &&
      'name' in child.props &&
      !child.props.name
    ) {
      throw new Error(
        `<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      if (
        ['component', 'getComponent'].some(
          (key) => child.props && typeof child.props === 'object' && key in child.props
        )
      ) {
        throw new Error(
          `<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`component\` or \`getComponent\` prop when used as a child of a Layout Route`
        );
      }
    }

    return true;
  }

  return false;
}
