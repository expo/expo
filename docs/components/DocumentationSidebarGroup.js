import styled, { keyframes, css } from 'react-emotion';
import NextLink from 'next/link';

import * as React from 'react';
import * as Constants from '~/common/constants';
import stripVersionFromPath from '~/common/stripVersionFromPath';

const STYLES_TITLE = css`
  display: block;
  position: relative;
  margin-bottom: 16px;
  line-height: 1.3rem;
  text-decoration: none;
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

if (typeof window !== 'undefined' && !window.hasOwnProperty('sidebarState')) {
  window.sidebarState = {};
}

export default class DocumentationSidebarGroup extends React.Component {
  constructor(props) {
    super(props);

    let isOpen = this.isChildRouteActive();
    if (typeof window !== 'undefined') {
      isOpen = isOpen || window.sidebarState[props.info.name];
    }

    // default to always open
    this.state = {
      isOpen: props.info.name === 'Depreacted' ? isOpen : true,
    };
  }

  persistGlobalSidebarState() {
    window.sidebarState[this.props.info.name] = this.state.isOpen;
  }

  hydrateGlobalSidebarState() {
    this.setState({ isOpen: window.sidebarState[this.props.info.name] });
  }

  componentDidMount() {
    if (typeof window !== 'undefined') {
      let persistedState = window.sidebarState[this.props.info.name];
      if (typeof persistedState === 'boolean' && this.state.isOpen !== persistedState) {
        this.setState({ isOpen: persistedState });
      } else {
        this.persistGlobalSidebarState();
      }
    }
  }

  isChildRouteActive() {
    // Special case for "Get Started"
    if (this.props.info.name === 'Getting to know Expo') {
      const pathname = this.props.url.pathname;
      const asPath = this.props.asPath;
      if (this.props.asPath.match(/\/versions\/[\w\.]+\/$/)) {
        return true;
      }
    }

    let result = false;

    let sections = this.props.info.children;

    const isSectionActive = section => {
      const linkUrl = stripVersionFromPath(section.as || section.href);
      const pathname = stripVersionFromPath(this.props.url.pathname);
      const asPath = stripVersionFromPath(this.props.asPath);

      if (
        linkUrl === pathname ||
        linkUrl === asPath ||
        linkUrl === '//' // accounts for 'index' page (Getting to know Expo)
      ) {
        result = true;
      }
    };

    let posts = [];
    sections.forEach(section => {
      posts = [...posts, ...section.posts];
    });

    posts.forEach(isSectionActive);
    return result;
  }

  _toggleIsOpen = () => {
    let isOpen = this.state.isOpen;
    this.setState({ isOpen: !isOpen });
    window.sidebarState[this.props.info.name] = !isOpen;
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
