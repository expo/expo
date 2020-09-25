import { css } from '@emotion/core';
import * as React from 'react';

import { paragraph } from './typography';

import * as Constants from '~/constants/theme';

const attributes = {
  'data-text': true,
};

const STYLES_UNORDERED_LIST = css`
  ${paragraph}
  list-style: none;
  margin-left: 1rem;
  margin-bottom: 1rem;

  .anchor-icon {
    display: none;
  }
`;

export const UL: React.FC = ({ children }) => (
  <ul {...attributes} css={STYLES_UNORDERED_LIST}>
    {children}
  </ul>
);

// TODO(jim): Get anchors working properly for ordered lists.
const STYLES_ORDERED_LIST = css`
  ${paragraph}
  list-style: none;
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
    content: '•';
    font-size: 130%;
    line-height: 0;
    margin: 0 0.5rem 0 -1rem;
    position: relative;
    color: ${Constants.colors.black80};
  }

  > div {
    display: inline;
  }
`;

export const LI: React.FC = ({ children }) => {
  return (
    <li css={STYLES_LIST_ITEM} className="docs-list-item">
      {children}
    </li>
  );
};
