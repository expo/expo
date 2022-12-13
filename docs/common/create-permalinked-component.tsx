import * as React from 'react';

import { AdditionalProps, HeadingType } from '~/common/headingManager';
import Permalink from '~/components/Permalink';

type Options = {
  baseNestingLevel?: number;
  sidebarType?: HeadingType;
};

type PermalinkedComponentProps = React.PropsWithChildren<
  { level?: number; id?: string } & AdditionalProps
>;

const isDev = process.env.NODE_ENV === 'development';

export const createPermalinkedComponent = (
  BaseComponent: React.ComponentType<React.PropsWithChildren<object>>,
  options?: Options
) => {
  const { baseNestingLevel, sidebarType = HeadingType.Text } = options || {};
  return ({ children, level, id, ...props }: PermalinkedComponentProps) => {
    const cleanChildren = React.Children.map(children, child => {
      if (React.isValidElement(child) && child?.props?.href) {
        isDev &&
          console.warn(
            `It looks like the header on this page includes a link, this is an invalid pattern, nested link will be removed!`,
            child?.props?.href
          );
        return (child as JSX.Element)?.props?.children;
      }
      return child;
    });
    const nestingLevel = baseNestingLevel != null ? (level ?? 0) + baseNestingLevel : undefined;
    return (
      <Permalink nestingLevel={nestingLevel} additionalProps={{ ...props, sidebarType }} id={id}>
        <BaseComponent>{cleanChildren}</BaseComponent>
      </Permalink>
    );
  };
};
