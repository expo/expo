import styled, { keyframes, css } from 'react-emotion';
import NextLink from 'next/link';

import * as React from 'react';
import * as Constants from '~/common/constants';

const STYLES_TITLE = css`
  display: block;
  margin-bottom: 16px;
  line-height: 1.3rem;
  text-decoration: none;
  text-transform: uppercase;
  font-family: ${Constants.fontFamilies.demi};
`;

const STYLES_ACTIVE = css`
  color: ${Constants.colors.expoLighter};

  :visited {
    color: ${Constants.colors.expo};
  }

  :hover {
    color: ${Constants.colors.expo};
  }
`;

const STYLES_DEFAULT = css`
  color: ${Constants.colors.black40};
  transition: 200ms ease color;

  :visited {
    color: ${Constants.colors.black40};
  }

  :hover {
    color: ${Constants.colors.expo};
  }
`;

export default class DocumentationSidebarLink extends React.Component {
  isSelected() {
    if (!this.props.url) {
      return false;
    }

    const linkUrl = this.props.info.as || this.props.info.href;

    if (linkUrl === this.props.url.pathname || linkUrl === this.props.asPath) {
      return true;
    }

    return false;
  }

  render() {
    if (!this.props.info.href) {
      return <div className={STYLES_TITLE}>{this.props.children}</div>;
    }

    return (
      <NextLink
        href={this.props.info.href}
        as={this.props.info.as || this.props.info.href}>
        <a className={`${STYLES_TITLE} ${this.isSelected() ? STYLES_ACTIVE : STYLES_DEFAULT}`}>
          {this.props.children}
        </a>
      </NextLink>
    );
  }
}
