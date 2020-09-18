import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Utilities from '~/common/utilities';

import withSlugger from '~/components/page-higher-order/withSlugger';

import * as Constants from '~/constants/theme';

import { paragraph } from './typography';

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

export const UL = ({ children }) => (
  <ul {...attributes} className={STYLES_UNORDERED_LIST}>
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

export const OL = ({ children }) => (
  <ol {...attributes} className={STYLES_ORDERED_LIST}>
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

export const LI = ({ children }) => {
  return <li className={`${STYLES_LIST_ITEM} docs-list-item`}>{children}</li>;
};
