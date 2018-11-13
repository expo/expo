import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Utilities from '~/common/utilities';

import BulletIcon from '~/components/icons/Bullet';
import withSlugger from '~/components/page-higher-order/withSlugger';

const attributes = {
  'data-text': true,
};

const STYLES_UNORDERED_LIST = css`
  padding: 0;
  margin-top: 24px;
  padding-left: 24px;
  list-style-image: none;
  list-style-type: none;
`;

export const UL = ({ children }) => (
  <ul {...attributes} className={STYLES_UNORDERED_LIST}>
    {children}
  </ul>
);

// TODO(jim): Get anchors working properly for ordered lists.
const STYLES_ORDERED_LIST = css`
  padding: 0;
  margin-top: 24px;
  padding-left: 16px;
  list-style-position: outside;
  list-style-image: none;

  .bullet-icon {
    display: none;
  }

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
  position: relative;
  margin-bottom: 16px;
`;

const STYLES_LIST_ITEM_BULLET = css`
  position: absolute;
  top: 4px;
  left: -20px;
  width: 20px;
  height: 20px;
`;

const STYLES_LIST_ITEM_BODY = css`
  font-size: 1rem;
  line-height: 1.8rem;
`;

export const LI = withSlugger(({ id, children, slugger }) => {
  if (id == null) {
    id = Utilities.generateSlug(slugger, children);
  }

  return (
    <li className={`${STYLES_LIST_ITEM} docs-list-item`}>
      <div className={STYLES_LIST_ITEM_BULLET}>
        <BulletIcon />
      </div>
      <div className={STYLES_LIST_ITEM_BODY}>{children}</div>
    </li>
  );
});
