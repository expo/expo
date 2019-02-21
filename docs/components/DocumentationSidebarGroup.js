import styled, { keyframes, css } from 'react-emotion';
import NextLink from 'next/link';

import * as React from 'react';
import * as Constants from '~/common/constants';

const STYLES_TITLE = css`
  display: block;
  position: relative;
  margin-bottom: 20px;
  line-height: 1.3rem;
  text-decoration: none;
  text-transform: uppercase;
  font-family: ${Constants.fontFamilies.demi};
  user-select: none;
  :hover {
    cursor: pointer;
  }
`;

const STYLES_SIDEBAR_INDENT = css`
  display: block;
  border-left-width: 1px;
  border-left-color: #ccc;
  border-left-style: dashed;
  padding-left: 15px;
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
        style={{ position: 'absolute', right: 0 }}
      />
    );
  }
}

export default class DocumentationSidebarGroup extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: this.isChildRouteActive(),
    };
  }

  isChildRouteActive() {
    let result = false;

    let sections = this.props.info.children;
    let posts = [];

    const isSectionActive = section => {
      const linkUrl = section.as || section.href;
      const pathname = this.props.url.pathname;
      const asPath = this.props.asPath;

      if (linkUrl === pathname || linkUrl === asPath) {
        result = true;
      }
    };

    sections.forEach(section => {
      posts = [...posts, ...section.posts];
    });

    sections.forEach(isSectionActive);
    posts.forEach(isSectionActive);
    return result;
  }

  _toggleIsOpen = () => {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  };

  render() {
    return (
      <div>
        <a
          className={`${STYLES_TITLE} ${this.state.isOpen ? STYLES_ACTIVE : STYLES_DEFAULT}`}
          onClick={this._toggleIsOpen}>
          {this.props.info.name}
          <Arrow isOpen={this.state.isOpen} />
        </a>
        {this.state.isOpen ? (
          <div className={STYLES_SIDEBAR_INDENT}>{this.props.children}</div>
        ) : null}
      </div>
    );
  }
}
