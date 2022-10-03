import { css } from '@emotion/react';
import { SerializedStyles } from '@emotion/serialize';
import { spacing, theme } from '@expo/styleguide';
import * as React from 'react';

import { paragraph } from './typography';

const attributes = {
  'data-text': true,
};

const STYLES_UNORDERED_LIST = css`
  ${paragraph}
  list-style: disc;
  margin-left: ${spacing[4]}px;
  margin-bottom: ${spacing[6]}px;

  .anchor-icon {
    display: none;
  }

  table & {
    margin: 0.5rem 1rem;
    line-height: 125%;

    &:first-of-type {
      margin-top: 0;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  ol,
  ul {
    margin-left: ${spacing[1]}px;
  }
`;

const STYLES_NO_LIST_STYLE = css({
  listStyle: 'none',
  marginLeft: 0,
  marginBottom: spacing[3],

  li: {
    marginLeft: '0.25rem',
  },
});

type ULProps = React.PropsWithChildren<{
  hideBullets?: boolean;
}>;

export const UL = ({ children, hideBullets }: ULProps) => (
  <ul {...attributes} css={[STYLES_UNORDERED_LIST, hideBullets && STYLES_NO_LIST_STYLE]}>
    {children}
  </ul>
);

// TODO(jim): Get anchors working properly for ordered lists.
const STYLES_ORDERED_LIST = css`
  ${STYLES_UNORDERED_LIST}
  list-style: decimal;
`;

type OLProps = React.PropsWithChildren<object>;

export const OL = ({ children }: OLProps) => (
  <ol {...attributes} css={STYLES_ORDERED_LIST}>
    {children}
  </ol>
);

const STYLES_LIST_ITEM = css`
  margin-left: ${spacing[4]}px;

  :before {
    font-size: 130%;
    line-height: 0;
    margin: 0 ${spacing[2]}px 0 -${spacing[4]}px;
    position: relative;
    color: ${theme.text.default};
  }
`;

const STYLE_PROP_LIST = css`
  ::marker {
    color: ${theme.text.secondary};
    font-size: 125%;
  }
`;

type LIProps = React.PropsWithChildren<{
  propType?: boolean;
  customCss?: SerializedStyles;
}>;

export const LI = ({ children, propType, customCss }: LIProps) => (
  <li css={[STYLES_LIST_ITEM, propType && STYLE_PROP_LIST, customCss]} className="docs-list-item">
    {children}
  </li>
);
