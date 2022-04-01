import { css } from '@emotion/react';
import { SerializedStyles } from '@emotion/serialize';
import { theme } from '@expo/styleguide';
import * as React from 'react';

import { paragraph } from './typography';

const attributes = {
  'data-text': true,
};

const STYLES_UNORDERED_LIST = css`
  & {
    ${paragraph}
    list-style: disc;
    margin-left: 1rem;
    margin-bottom: 1rem;

    .anchor-icon {
      display: none;
    }
  }

  table & {
    margin: 0.5rem 1rem;
    line-height: 125%;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const STYLES_NO_LIST_STYLE = css`
  list-style: none;
  margin-left: 0;
`;

type ULProps = {
  hideBullets?: boolean;
};

export const UL: React.FC<ULProps> = ({ children, hideBullets }) => (
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

export const OL: React.FC = ({ children }) => (
  <ol {...attributes} css={STYLES_ORDERED_LIST}>
    {children}
  </ol>
);

const STYLES_LIST_ITEM = css`
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

const STYLE_RETURN_LIST = css`
  list-style-type: '⮑';
  padding-left: 0.5rem;
  margin-left: 0.25rem;

  ::marker {
    color: ${theme.icon.secondary};
    font-size: 90%;
  }
`;

const STYLE_PROP_LIST = css`
  ::marker {
    color: ${theme.text.secondary};
    font-size: 125%;
  }
`;

type LIProps = {
  returnType?: boolean;
  propType?: boolean;
  customCss?: SerializedStyles;
};

export const LI: React.FC<LIProps> = ({ children, returnType, propType, customCss }) => {
  return (
    <li
      css={[
        STYLES_LIST_ITEM,
        returnType && STYLE_RETURN_LIST,
        propType && STYLE_PROP_LIST,
        customCss,
      ]}
      className="docs-list-item">
      {children}
    </li>
  );
};
