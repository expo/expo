import styled, { keyframes, css } from 'react-emotion';
import * as React from 'react';
import BulletIcon from '~/components/icons/Bullet';
import * as Constants from '~/common/constants';

const STYLES_TITLE = css`
  font-family: ${Constants.fonts.demi};
  font-weight: 400;
  line-height: 1.625rem;
  font-size: 1.1rem;
  margin-bottom: 1rem;
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

const STYLES_INLINE_CODE = css`
  color: ${Constants.expoColors.gray[900]};
  :hover {
    color: ${Constants.colors.expoLighter};
  }
  font-family: ${Constants.fontFamilies.mono};
  font-size: 0.9rem;
  white-space: pre-wrap;
  display: inline;
  padding: 4px;
  margin: 2px;
  line-height: 20px;
  max-width: 100%;

  word-wrap: break-word;
  background-color: ${Constants.expoColors.gray[200]};
  border-radius: 2px;
  vertical-align: middle;
  overflow-x: scroll;

  ::before {
    content: '';
  }

  ::after {
    content: '';
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
          <p className={STYLES_TITLE}>{title}</p>
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
                  <code className={STYLES_INLINE_CODE}>{data}</code>
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
