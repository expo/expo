import * as React from 'react';

import { AdditionalProps } from './headingManager';

import Permalink from '~/components/Permalink';
import { Code, InlineCode } from '~/components/base/code';
import { ExpoKitDetails, BareWorkflowDetails } from '~/components/base/details';
import { H1, H2, H3, H4 } from '~/components/base/headings';
import Link from '~/components/base/link';
import { UL, OL, LI } from '~/components/base/list';
import { PDIV, B, Quote } from '~/components/base/paragraph';

type Options = {
  customIconStyle?: React.CSSProperties;
  baseNestingLevel?: number;
};

type PermalinkedComponent = React.FC<{ level?: number } & AdditionalProps>;

const createPermalinkedComponent = (
  BaseComponent: React.ComponentType,
  options?: Options
): PermalinkedComponent => {
  const { customIconStyle, baseNestingLevel } = options || {};
  return ({ children, level, ...props }) => {
    const nestingLevel = baseNestingLevel != null ? (level ?? 0) + baseNestingLevel : undefined;
    return (
      <Permalink
        nestingLevel={nestingLevel}
        customIconStyle={customIconStyle}
        additionalProps={props}>
        <BaseComponent>{children}</BaseComponent>
      </Permalink>
    );
  };
};

// When using inline markdown, we need to remove the document layout wrapper.
// Always set this to `null` to overwrite the global MDX provider.
export const wrapper = null;

export const p = PDIV;
export const strong = B;
export const ul = UL;
export const li = LI;
export const ol = OL;
export const h1 = createPermalinkedComponent(H1, { baseNestingLevel: 1 });
export const h2 = createPermalinkedComponent(H2, { baseNestingLevel: 2 });
export const h3 = createPermalinkedComponent(H3, { baseNestingLevel: 3 });
export const h4 = createPermalinkedComponent(H4, { baseNestingLevel: 4 });
export const code = Code;
export const inlineCode = InlineCode;
export const a = Link;
export const blockquote = Quote;
export const expokitDetails = ExpoKitDetails;
export const bareworkflowDetails = BareWorkflowDetails;
export const propertyAnchor = createPermalinkedComponent(PDIV, {
  baseNestingLevel: 3,
});
export const subpropertyAnchor = createPermalinkedComponent(PDIV, {
  baseNestingLevel: 3,
});
