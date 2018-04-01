import styled, { keyframes, css } from 'react-emotion';

import * as React from 'react';
import * as Utilities from '~/common/utilities';

import PermalinkIcon from '~/components/icons/permalink-icon';
import BulletIcon from '~/components/icons/bullet-icon';

const STYLES_UNORDERED_LIST = css`
  padding: 0;
  margin-left: 16px;
  margin-top: 24px;
  list-style-image: none;
  list-style-type: none;
`;

export const UL = ({ children }) => <ul className={STYLES_UNORDERED_LIST}>{children}</ul>;

const STYLES_ORDERED_LIST = css`
  padding-left: 0;
  margin-left: 16px;
  margin-top: 24px;
  list-style-position: outside;
  list-style-image: none;
`;

export const OL = ({ children }) => <ol className={STYLES_ORDERED_LIST}>{children}</ol>;

const STYLES_LIST_ITEM = css`
  position: 'relative';
`;

const STYLES_LIST_ITEM_ANCHOR = css`
  width: 20px;
  height: 20px;
`;

const STYLES_LIST_ITEM_TARGET = css`
  display: block;
  position: absolute
  top: -100px;
  visibility: hidden;
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
      <div>{children}</div>
    </li>
  );
};
