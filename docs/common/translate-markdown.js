import * as React from 'react';

import Permalink from '~/components/Permalink';
import { Code, InlineCode } from '~/components/base/code';
import { ExpoKitDetails, BareWorkflowDetails } from '~/components/base/details';
import { H2, H3, H4 } from '~/components/base/headings';
import { ExternalLink } from '~/components/base/link';
import { UL, OL, LI } from '~/components/base/list';
import { PDIV, P, Quote } from '~/components/base/paragraph';

const createPermalinkedComponent = (BaseComponent, options) => {
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

export const p = PDIV;
export const strong = P.B;
export const ul = UL;
export const li = LI;
export const ol = OL;
export const h2 = createPermalinkedComponent(H2, { baseNestingLevel: 2 });
export const h3 = createPermalinkedComponent(H3, { baseNestingLevel: 3 });
export const h4 = createPermalinkedComponent(H4, { baseNestingLevel: 4 });
export const code = Code;
export const inlineCode = InlineCode;
export const a = ExternalLink;
export const blockquote = Quote;
export const expokitDetails = ExpoKitDetails;
export const bareworkflowDetails = BareWorkflowDetails;
export const propertyAnchor = createPermalinkedComponent(PDIV, {
  baseNestingLevel: 3,
  customIconStyle: { top: -8 },
});
export const subpropertyAnchor = createPermalinkedComponent(PDIV, {
  customIconStyle: { left: -44, top: -8 },
  baseNestingLevel: 3,
});
