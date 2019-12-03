import styled, { keyframes, css } from 'react-emotion';
import * as React from 'react';
import BulletIcon from '~/components/icons/Bullet';
import * as Constants from '~/common/constants';

const STYLES_UNORDERED_LIST = css`
  padding: 0;
  margin-top: 24px;
  padding-left: 24px;
  list-style-image: none;
  list-style-type: none;
`;

const STYLES_LIST_ITEM = css`
  display: inline-block;
  position: relative;
  margin-bottom: 16px;
  margin-right: 16px;
  font-size: 1rem;
  line-height: 1.8rem;
`;

const STYLES_LIST_ITEM_BULLET = css`
  display: inline-block;
  position: relative;
  top: 2px;
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
  color: ${Constants.colors.black80};
  :hover {
    color: ${Constants.colors.expoLighter};
    text-decoration: underline;
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
  background-color: ${Constants.colors.blackRussian};
  vertical-align: middle;
  overflow-x: scroll;

  ::before {
    content: '';
  }

  ::after {
    content: '';
  }
`;

export default class HorizontalList extends React.Component {
  render() {
    return (
      <ul style={{ padding: 0, marginTop: 24 }}>
        {this.props.contents.map(data => {
          if (this.props.useCodeBlock) {
            return (
              <a
                href={`#${data
                  .trim()
                  .toLowerCase()
                  .replace(/[^\w\- ]+/g, '')
                  .replace(/\s/g, '-')
                  .replace(/\-+$/, '')}`}
                className={STYLES_EXTERNAL_LINK}
                rel="noopener noreferrer">
                <li className={`${STYLES_LIST_ITEM} docs-list-item`}>
                  <div className={STYLES_LIST_ITEM_BULLET}>
                    <BulletIcon />
                  </div>
                  <code className={STYLES_INLINE_CODE}>{data}</code>
                </li>
              </a>
            );
          } else {
            return (
              <a
                href={`#${data
                  .trim()
                  .toLowerCase()
                  .replace(/[^\w\- ]+/g, '')
                  .replace(/\s/g, '-')
                  .replace(/\-+$/, '')}`}
                className={STYLES_EXTERNAL_LINK}
                rel="noopener noreferrer">
                <li className={`${STYLES_LIST_ITEM} docs-list-item`}>
                  <div className={STYLES_LIST_ITEM_BULLET}>
                    <BulletIcon />
                  </div>
                  {data}
                </li>
              </a>
            );
          }
        })}
      </ul>
    );
  }
}

function stripModuleNamespace(data) {
  let index = data.indexOf('.');
  if (index === -1) {
    return data;
  }
  return data.substring(index + 1, data.length);
}
