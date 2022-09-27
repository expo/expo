import * as React from 'react';

import { AdditionalProps, HeadingType } from '~/common/headingManager';
import Permalink from '~/components/Permalink';

type Options = {
  customIconStyle?: React.CSSProperties;
  baseNestingLevel?: number;
  sidebarType?: HeadingType;
};

type PermalinkedComponentProps = React.PropsWithChildren<{ level?: number } & AdditionalProps>;

const isDev = process.env.NODE_ENV === 'development';

export const createPermalinkedComponent = (
  BaseComponent: React.ComponentType<React.PropsWithChildren<object>>,
  options?: Options
) => {
  const { customIconStyle, baseNestingLevel, sidebarType = HeadingType.Text } = options || {};
  return ({ children, level, ...props }: PermalinkedComponentProps) => {
    const cleanChildren = React.Children.map(children, child => {
      if (React.isValidElement(child) && child?.props?.href) {
        isDev &&
          console.warn(
            `It looks like the header on this page includes a link, this is an invalid pattern, nested link will be removed!`,
            child?.props?.href
          );
        return child?.props?.children;
      }
      return child;
    });
    const nestingLevel = baseNestingLevel != null ? (level ?? 0) + baseNestingLevel : undefined;
    return (
      <Permalink
        nestingLevel={nestingLevel}
        customIconStyle={customIconStyle}
        additionalProps={{ ...props, sidebarType }}>
        <BaseComponent>{cleanChildren}</BaseComponent>
      </Permalink>
    );
  };
};
