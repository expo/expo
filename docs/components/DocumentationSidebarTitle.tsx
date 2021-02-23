import { css } from '@emotion/core';
import { theme } from '@expo/styleguide';
import NextLink from 'next/link';
import * as React from 'react';

import { paragraph } from '~/components/base/typography';
import * as Constants from '~/constants/theme';
import { NavigationRoute, Url } from '~/types/common';

const STYLES_TITLE = css`
  ${paragraph}
  font-size: 15px;
  display: block;
  position: relative;
  margin-bottom: 12px;
  text-decoration: none;
  font-family: ${Constants.fontFamilies.demi};
  border-bottom: 1px solid ${theme.border.default};
  padding-bottom: 0.25rem;
`;

const STYLES_ACTIVE = css`
  color: ${theme.link.default};

  :visited {
    color: ${theme.link.default};
  }

  :hover {
    color: ${theme.link.default};
  }
`;

const STYLES_DEFAULT = css`
  color: ${theme.text.secondary};
  transition: 200ms ease color;

  :visited {
    color: ${theme.text.secondary};
  }

  :hover {
    color: ${theme.link.default};
  }
`;

type Props = {
  url?: Url;
  info: NavigationRoute;
  asPath: string;
};

export default class DocumentationSidebarTitle extends React.Component<Props, { isOpen: boolean }> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isOpen: this.isSelected(), // || this.isChildRouteActive(),
    };
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

  isChildRouteActive() {
    const { pathname } = this.props.url || {};
    let result = false;

    this.props.info.posts?.forEach(post => {
      const linkUrl = post.as || post.href;
      const asPath = this.props.asPath;

      if (linkUrl === pathname || linkUrl === asPath) {
        result = true;
      }
    });

    return result;
  }

  _toggleIsOpen = () => {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  };

  render() {
    if (!this.props.info.href) {
      return <div css={STYLES_TITLE}>{this.props.children}</div>;
    }

    return (
      <div css={[STYLES_TITLE, this.isSelected() ? STYLES_ACTIVE : STYLES_DEFAULT]}>
        <NextLink href={this.props.info.href} as={this.props.info.as || this.props.info.href}>
          <div>{this.props.children}</div>
        </NextLink>
      </div>
    );
  }
}
