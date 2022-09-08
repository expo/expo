import * as React from 'react';

import { AdditionalProps, HeadingType } from '~/common/headingManager';
import Permalink from '~/components/Permalink';

type Options = {
  customIconStyle?: React.CSSProperties;
  baseNestingLevel?: number;
  sidebarType?: HeadingType;
};

type PermalinkedComponentProps = React.PropsWithChildren<{ level?: number } & AdditionalProps>;

export const createPermalinkedComponent = (
  BaseComponent: React.ComponentType<React.PropsWithChildren<object>>,
  options?: Options
) => {
  const { customIconStyle, baseNestingLevel, sidebarType = HeadingType.Text } = options || {};
  return ({ children, level, ...props }: PermalinkedComponentProps) => {
    const nestingLevel = baseNestingLevel != null ? (level ?? 0) + baseNestingLevel : undefined;
    return (
      <Permalink
        nestingLevel={nestingLevel}
        customIconStyle={customIconStyle}
        additionalProps={{ ...props, sidebarType }}>
        <BaseComponent>{children}</BaseComponent>
      </Permalink>
    );
  };
};
