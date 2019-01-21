import styled, { keyframes, css } from 'react-emotion';
import NextLink from 'next/link';

import * as React from 'react';
import * as Constants from '~/common/constants';

const STYLES_LINK = css`
  display: block;
  margin-bottom: 10px;
  line-height: 1.3rem;
  text-decoration: none;
`;

const STYLES_ACTIVE = css`
  font-family: ${Constants.fontFamilies.demi};
  color: ${Constants.colors.expoLighter};

  :visited {
    color: ${Constants.colors.expo};
  }

  :hover {
    color: ${Constants.colors.expo};
  }
`;

const STYLES_DEFAULT = css`
  font-family: ${Constants.fontFamilies.book};
  color: ${Constants.colors.black80};
  transition: 200ms ease color;

  :visited {
    color: ${Constants.colors.black60};
  }

  :hover {
    color: ${Constants.colors.expo};
  }
`;

export default class DocumentationSidebarLink extends React.Component {
  componentDidMount() {
    // Consistent link behavior across dev server and static export
    global.__NEXT_DATA__.nextExport = true
  }

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
    const customDataAttributes = this.isSelected()
      ? {
          'data-sidebar-anchor-selected': true,
        }
      : {};

    return (
      <NextLink
        prefetch
        href={this.props.info.href}
        as={this.props.info.as || this.props.info.href}>
        <a
          {...customDataAttributes}
          className={`${STYLES_LINK} ${this.isSelected() ? STYLES_ACTIVE : STYLES_DEFAULT}`}>
          {this.props.children}
        </a>
      </NextLink>
    );
  }
}
