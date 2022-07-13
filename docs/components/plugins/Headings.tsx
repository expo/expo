import * as React from 'react';

import Permalink from '../Permalink';

import { HeadingType } from '~/common/headingManager';
import { H1 as RawH1, H2 as RawH2, H3 as RawH3, H4 as RawH4 } from '~/components/base/headings';

type CreateHeading = (
  Component: React.ElementType,
  defaultLevel: number,
  type?: HeadingType
) => React.FC;

/**
 * Decorates component with a permalink at specified heading level
 * @param {*} Component component to decorate with
 * @param {number} defaultLevel default heading level for the permalink
 * @param type The `HeadingType` of heading for right sidebar, defaults to `HeadingType.Text`
 */
const createHeading: CreateHeading =
  (Component, defaultLevel, type = HeadingType.Text) =>
  ({ children, ...props }) => {
    return (
      <Permalink nestingLevel={defaultLevel} additionalProps={{ sidebarType: type, ...props }}>
        <Component>{children}</Component>
      </Permalink>
    );
  };

export const H1 = createHeading(RawH1, 1);
export const H2 = createHeading(RawH2, 2);
export const H3 = createHeading(RawH3, 3);
export const H4 = createHeading(RawH4, 4);

export const H3Code = createHeading(RawH3, 3, HeadingType.InlineCode);
export const H4Code = createHeading(RawH4, 4, HeadingType.InlineCode);
