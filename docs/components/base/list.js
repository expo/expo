import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Utilities from '~/common/utilities';

import PermalinkIcon from '~/components/icons/Permalink';
import BulletIcon from '~/components/icons/Bullet';

const STYLES_UNORDERED_LIST = css`
  padding: 0;
  margin-top: 24px;
  list-style-image: none;
  list-style-type: none;
`;

export const UL = ({ children }) => <ul className={STYLES_UNORDERED_LIST}>{children}</ul>;

const STYLES_ORDERED_LIST = css`
  padding: 0;
  margin-top: 24px;
  list-style-position: outside;
  list-style-image: none;
`;

export const OL = ({ children }) => <ol className={STYLES_ORDERED_LIST}>{children}</ol>;

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
  top: 0;
  left: 0;
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
  line-height: 1.2rem;
  padding-left: 24px;
`;

export const LI = ({ id, children }) => {
  if (id == null) {
    id = Utilities.generateSlug(children);
  }

  return (
    <li className={STYLES_LIST_ITEM}>
      <span id={id} className={STYLES_LIST_ITEM_TARGET} />
      <a href={'#' + id} className={`${STYLES_LIST_ITEM_ANCHOR} anchor`}>
        <BulletIcon />
        <PermalinkIcon />
      </a>
      <div className={STYLES_LIST_ITEM_BODY}>{children}</div>
    </li>
  );
};
