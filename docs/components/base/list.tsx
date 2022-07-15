import { css } from '@emotion/react';
import { SerializedStyles } from '@emotion/serialize';
import { theme } from '@expo/styleguide';
import * as React from 'react';

import { paragraph } from './typography';

const attributes = {
  'data-text': true,
};

const STYLES_UNORDERED_LIST = css`
  ${paragraph}
  list-style: disc;
  margin-left: 1rem;
  margin-bottom: 1rem;

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
`;

const STYLES_NO_LIST_STYLE = css({
  listStyle: 'none',
  marginLeft: 0,

  li: {
    marginLeft: '0.25rem',
  },
});

type ULProps = {
  hideBullets?: boolean;
};

export const UL: React.FC<React.PropsWithChildren<ULProps>> = ({ children, hideBullets }) => (
  <ul {...attributes} css={[STYLES_UNORDERED_LIST, hideBullets && STYLES_NO_LIST_STYLE]}>
    {children}
  </ul>
);

// TODO(jim): Get anchors working properly for ordered lists.
const STYLES_ORDERED_LIST = css`
  ${paragraph}
  list-style: decimal;
  margin-left: 1rem;
  margin-bottom: 1rem;

  .anchor-icon {
    display: none;
  }
`;

export const OL: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => (
  <ol {...attributes} css={STYLES_ORDERED_LIST}>
    {children}
  </ol>
);

const STYLES_LIST_ITEM = css`
  margin-left: 1rem;
  padding: 0.25rem 0;
  :before {
    font-size: 130%;
    line-height: 0;
    margin: 0 0.5rem 0 -1rem;
    position: relative;
    color: ${theme.text.default};
  }

  > div {
    display: inline;
  }
`;

const STYLE_PROP_LIST = css`
  ::marker {
    color: ${theme.text.secondary};
    font-size: 125%;
  }
`;

type LIProps = {
  propType?: boolean;
  customCss?: SerializedStyles;
};

export const LI: React.FC<React.PropsWithChildren<LIProps>> = ({
  children,
  propType,
  customCss,
}) => {
  return (
    <li css={[STYLES_LIST_ITEM, propType && STYLE_PROP_LIST, customCss]} className="docs-list-item">
      {children}
    </li>
  );
};
