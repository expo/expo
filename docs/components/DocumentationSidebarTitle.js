import styled, { keyframes, css } from 'react-emotion';
import NextLink from 'next/link';

import * as React from 'react';
import * as Constants from '~/common/constants';
import { paragraph } from '~/components/base/typography';

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

class Arrow extends React.Component {
  render() {
    return (
      <i
        className={`fas fa-chevron-${this.props.isOpen ? 'up' : 'down'}`}
        style={{ position: 'absolute', right: 0, top: 0 }}
      />
    );
  }
}

export default class DocumentationSidebarTitle extends React.Component {
  constructor(props) {
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
    let result = false;
    let posts = this.props.posts;

    this.props.info.posts.forEach(post => {
      const linkUrl = post.as || post.href;
      const pathname = this.props.url.pathname;
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
      return <div className={STYLES_TITLE}>{this.props.children}</div>;
    }

    return (
      <div className={`${STYLES_TITLE} ${this.isSelected() ? STYLES_ACTIVE : STYLES_DEFAULT}`}>
        <NextLink href={this.props.info.href} as={this.props.info.as || this.props.info.href}>
          <div>{this.props.children}</div>
        </NextLink>
      </div>
    );
  }
}
