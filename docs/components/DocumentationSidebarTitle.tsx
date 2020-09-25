import { css } from '@emotion/core';
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
  border-bottom-color: #ccc;
  font-family: ${Constants.fontFamilies.demi};
  border-bottom: 1px solid ${Constants.expoColors.gray[250]};
  padding-bottom: 0.25rem;
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

  //
  // TODO: move rendering of child links here so we can make sections collapsable
  //
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
