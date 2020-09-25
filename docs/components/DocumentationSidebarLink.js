import { css } from '@emotion/core';
import NextLink from 'next/link';

import * as React from 'react';
import * as Constants from '~/constants/theme';
import stripVersionFromPath from '~/common/stripVersionFromPath';
import { paragraph } from '~/components/base/typography';

const STYLES_LINK = css`
  display: block;
  text-decoration: none;
`;

const STYLES_ACTIVE = css`
  ${paragraph}
  font-size: 15px;
  line-height: 140%;
  font-family: ${Constants.fontFamilies.demi};
  color: ${Constants.colors.expoLighter};
  position: relative;
  left: -7px;

  :visited {
    color: ${Constants.expoColors.primary[500]};
  }

  :hover {
    color: ${Constants.expoColors.primary[500]};
  }
`;

const STYLES_DEFAULT = css`
  ${paragraph}
  color: ${Constants.colors.black80};
  line-height: 140%;
  transition: 200ms ease color;
  font-size: 15px;

  :visited {
    color: ${Constants.colors.black60};
  }

  :hover {
    color: ${Constants.expoColors.primary[500]};
  }
`;

const STYLES_ACTIVE_CONTAINER = css`
  display: flex;
  margin-bottom: 12px;
  cursor: pointer;
`;

const STYLES_ACTIVE_BULLET = css`
  min-height: 6px;
  min-width: 6px;
  height: 6px;
  width: 6px;
  background-color: ${Constants.expoColors.primary[500]};
  border-radius: 4px;
  position: relative;
  left: -12px;
  top: 7px;
`;

export default class DocumentationSidebarLink extends React.Component {
  componentDidMount() {
    // Consistent link behavior across dev server and static export
    global.__NEXT_DATA__.nextExport = true;
  }

  isSelected() {
    if (!this.props.url) {
      console.log('[debug] isSelected bailed out, no url', this.props);
      return false;
    }

    // Special case for root url
    if (this.props.info.name === 'Introduction') {
      const { asPath } = this.props;
      if (asPath.match(/\/versions\/[\w\.]+\/$/) || asPath === '/versions/latest/') {
        return true;
      }
    }

    const linkUrl = stripVersionFromPath(this.props.info.as || this.props.info.href);
    if (
      linkUrl === stripVersionFromPath(this.props.url.pathname) ||
      linkUrl === stripVersionFromPath(this.props.asPath)
    ) {
      return true;
    }

    return false;
  }

  render() {
    const customDataAttributes = this.isSelected()
      ? {
          'data-sidebar-anchor-selected': true,
        }
      : {};

    return (
      <NextLink href={this.props.info.href} as={this.props.info.as || this.props.info.href}>
        <div css={STYLES_ACTIVE_CONTAINER}>
          {this.isSelected() && <div css={STYLES_ACTIVE_BULLET} />}
          <a
            {...customDataAttributes}
            css={[STYLES_LINK, this.isSelected() ? STYLES_ACTIVE : STYLES_DEFAULT]}>
            {this.props.children}
          </a>
        </div>
      </NextLink>
    );
  }
}
