import { css } from '@emotion/core';
import * as React from 'react';

import { InlineCode } from '~/components/base/code';
import { H4 } from '~/components/base/headings';
import BulletIcon from '~/components/icons/Bullet';
import * as Constants from '~/constants/theme';

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

type Props = {
  title: string;
  contents: string[];
  horizontal?: boolean;
};

export default class TableOfContentSection extends React.Component<Props> {
  render() {
    const { title, contents, horizontal } = this.props;
    return (
      <div>
        <a
          href={`#${createAnchorLink(title)}`}
          css={STYLES_EXTERNAL_LINK}
          rel="noopener noreferrer">
          <H4 css={STYLES_TITLE}>{title}</H4>
        </a>
        <ul
          css={css`
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
                css={STYLES_EXTERNAL_LINK}
                rel="noopener noreferrer">
                <li
                  css={horizontal ? STYLES_HORIZONTAL_ITEM : STYLES_VERTICAL_ITEM}
                  className="docs-list-item">
                  <div css={horizontal ? STYLES_HORIZONTAL_BULLET : STYLES_VERTICAL_BULLET}>
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

function createAnchorLink(data: string) {
  return data
    .trim()
    .toLowerCase()
    .replace(/[^\w\- ]+/g, '')
    .replace(/\s/g, '-')
    .replace(/-+$/, '');
}
