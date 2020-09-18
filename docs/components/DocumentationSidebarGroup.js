import NextLink from 'next/link';
import * as React from 'react';
import styled, { keyframes, css } from 'react-emotion';

import * as Constants from '~/constants/theme';
import stripVersionFromPath from '~/common/stripVersionFromPath';
import { paragraph } from '~/components/base/typography';
import ChevronDown from '~/components/icons/ChevronDown';

const STYLES_TITLE = css`
  ${paragraph}
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  margin-bottom: 16px;
  text-decoration: none;
  font-family: ${Constants.fontFamilies.demi};
  user-select: none;
  background: ${Constants.expoColors.gray[200]};
  padding: 8px 16px;
  border-radius: 4px;
  color: ${Constants.expoColors.black};

  :hover {
    cursor: pointer;
  }
`;

const STYLES_SIDEBAR_INDENT = css`
  padding-left: 16px;
`;

const STYLES_OPEN_CHEVRON_ICON = css`
  transform: rotate(180deg);
`;

class Arrow extends React.Component {
  render() {
    return (
      <i
        className={`fas fa-chevron-${this.props.isOpen ? 'up' : 'down'}`}
        style={{ position: 'absolute', right: 8, top: 5 }}
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
      isOpen: props.info.name === 'Deprecated' ? isOpen : true,
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
      const persistedState = window.sidebarState[this.props.info.name];
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

    const sections = this.props.info.children;

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
    const isOpen = this.state.isOpen;
    this.setState({ isOpen: !isOpen });
    window.sidebarState[this.props.info.name] = !isOpen;
  };

  render() {
    return (
      <div>
        <a className={STYLES_TITLE} onClick={this._toggleIsOpen}>
          {this.props.info.name}
          <ChevronDown size={16} className={this.state.isOpen ? STYLES_OPEN_CHEVRON_ICON : null} />
        </a>
        {this.state.isOpen ? (
          <div className={STYLES_SIDEBAR_INDENT}>{this.props.children}</div>
        ) : null}
      </div>
    );
  }
}
