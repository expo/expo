import type { JSXElementConstructor, PropsWithChildren, ReactElement, ReactNode } from 'react';
import React, { isValidElement } from 'react';

import type { NativeTabOptions } from './NativeTabsView';
import { Badge, Icon, Title } from './NavigatorElements';

export type TabProps = PropsWithChildren<{
  name: string;
  options?: NativeTabOptions;
}>;

export function Tab(props: TabProps) {
  return null;
}

export function convertTabPropsToOptions({ options, children }: TabProps) {
  const allowedChildren = filterAllowedChildrenElements(children, [Badge, Title, Icon]);
  return allowedChildren.reduce<NativeTabOptions>(
    (acc, child) => {
      if (isChildOfType(child, Badge)) {
        acc.badgeValue = child.props.value;
      } else if (isChildOfType(child, Title)) {
        acc.title = child.props.children;
        if (child.props.style) {
          acc.tabBarItemTitleFontFamily = child.props.style.fontFamily;
          acc.tabBarItemTitleFontSize = child.props.style.fontSize;
          acc.tabBarItemTitleFontWeight = child.props.style.fontWeight;
          acc.tabBarItemTitleFontStyle = child.props.style.fontStyle;
          acc.tabBarItemTitleFontColor = child.props.style.fontColor;
        }
      } else if (isChildOfType(child, Icon)) {
        if ('sfSymbolName' in child.props) {
          acc.iconSFSymbolName = child.props.sfSymbolName;
        } else if ('children' in child.props) {
          // TODO: Once there is support for custom icons, we can handle this case
        }
      }
      return acc;
    },
    { ...options }
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
        ['children', 'component', 'getComponent'].some(
          (key) => child.props && typeof child.props === 'object' && key in child.props
        )
      ) {
        throw new Error(
          `<Screen /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`children\`, \`component\`, or \`getComponent\` prop when used as a child of a Layout Route`
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
