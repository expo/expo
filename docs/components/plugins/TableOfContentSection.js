import styled, { keyframes, css } from 'react-emotion';
import * as React from 'react';
import BulletIcon from '~/components/icons/Bullet';
import * as Constants from '~/constants/theme';
import { InlineCode } from '~/components/base/code';
import { H4 } from '~/components/base/headings';

const STYLES_TITLE = css`
  margin-top: 2rem;
`;

const STYLES_HORIZONTAL_ITEM = css`
  display: inline-block;
  position: relative;
  margin-bottom: 16px;
  margin-right: 24px;
  font-size: 1rem;
  line-height: 1.8rem;
`;

const STYLES_VERTICAL_ITEM = css`
  position: relative;
  margin-bottom: 16px;
  font-size: 1rem;
  line-height: 1.8rem;
`;

const STYLES_HORIZONTAL_BULLET = css`
  display: inline-block;
  position: relative;
  top: 4px;
  width: 20px;
  height: 20px;
`;

const STYLES_VERTICAL_BULLET = css`
  position: absolute;
  top: 4px;
  left: -20px;
  width: 20px;
  height: 20px;
`;

const STYLES_EXTERNAL_LINK = css`
  text-decoration: none;
  color: ${Constants.colors.black80};
  font-size: inherit;
  :hover {
    color: ${Constants.colors.expoLighter};
    text-decoration: underline;
  }
`;

export default class TableOfContentSection extends React.Component {
  render() {
    const { title, contents, horizontal } = this.props;
    return (
      <div>
        <a
          href={`#${createAnchorLink(title)}`}
          className={STYLES_EXTERNAL_LINK}
          rel="noopener noreferrer">
          <H4 className={STYLES_TITLE}>{title}</H4>
        </a>
        <ul
          className={css`
            padding: 0;
            margin-top: 24px;
            padding-left: ${horizontal ? '4px' : '24px'};
            list-style-image: none;
            list-style-type: none;
          `}>
          {contents.map(data => {
            return (
              <a
                key={data}
                href={`#${createAnchorLink(data)}`}
                className={STYLES_EXTERNAL_LINK}
                rel="noopener noreferrer">
                <li
                  className={`${
                    horizontal ? STYLES_HORIZONTAL_ITEM : STYLES_VERTICAL_ITEM
                  } docs-list-item`}>
                  <div className={horizontal ? STYLES_HORIZONTAL_BULLET : STYLES_VERTICAL_BULLET}>
                    <BulletIcon />
                  </div>
                  <InlineCode>{data}</InlineCode>
                </li>
              </a>
            );
          })}
        </ul>
      </div>
    );
  }
}

function createAnchorLink(data) {
  return data
    .trim()
    .toLowerCase()
    .replace(/[^\w\- ]+/g, '')
    .replace(/\s/g, '-')
    .replace(/\-+$/, '');
}

function stripModuleNamespace(data) {
  let index = data.indexOf('.');
  if (index === -1) {
    return data;
  }
  return data.substring(index + 1, data.length);
}
