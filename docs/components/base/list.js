import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Utilities from '~/common/utilities';

import PermalinkIcon from '~/components/icons/Permalink';
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

  .bullet-icon {
    visibility: visible;
  }

  .anchor-icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 16px;
    height: 16px;
    visibility: hidden;
  }

  :hover {
    .bullet-icon {
      visibility: hidden;
    }

    .anchor-icon {
      visibility: visible;
    }
  }
`;

const STYLES_LIST_ITEM_ANCHOR = css`
  position: absolute;
  top: 4px;
  left: -20px;
  width: 20px;
  height: 20px;
`;

const STYLES_LIST_ITEM_TARGET = css`
  display: block;
  position: absolute
  top: -100px;
  visibility: hidden;
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
      <span id={id} className={STYLES_LIST_ITEM_TARGET} />
      <a href={'#' + id} className={`${STYLES_LIST_ITEM_ANCHOR} anchor`}>
        <BulletIcon />
        <PermalinkIcon />
      </a>
      <div className={STYLES_LIST_ITEM_BODY}>{children}</div>
    </li>
  );
});
