// NOTE(jim):
// GETTING NESTED SCROLL RIGHT IS DELICATE BUSINESS. THEREFORE THIS COMPONENT
// IS THE ONLY PLACE WHERE SCROLL CODE SHOULD BE HANDLED. THANKS.
import * as React from 'react';
import styled, { keyframes, css, injectGlobal } from 'react-emotion';

import * as Constants from '~/constants/theme';

// NOTE(jim): Global styles if and only if this component is used.
injectGlobal`
  body {
    background: ${Constants.colors.white};
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    html {
      /* width */
      ::-webkit-scrollbar {
        width: 6px;

      }

      /* Track */
      ::-webkit-scrollbar-track {
        background: ${Constants.expoColors.background};
      }

      /* Handle */
      ::-webkit-scrollbar-thumb {
        background: ${Constants.expoColors.gray[200]};
        border-radius: 10px;
      }

      /* Handle on hover */
      ::-webkit-scrollbar-thumb:hover {
        background: ${Constants.expoColors.gray[300]};
      }
    }
  }
`;

const STYLES_CONTAINER = css`
  width: 100%;
  height: 100vh;
  overflow; hidden;
  margin: 0 auto 0 auto;
  border-left: 1px solid ${Constants.expoColors.gray[250]};
  border-right: 1px solid ${Constants.expoColors.gray[250]};
  background: #f9f9f9;

  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;

  @media screen and (max-width: 1440px) {
    border-left: 0px;
    border-right: 0px;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    display: block;
    height: auto;
  }
`;

const STYLES_HEADER = css`
  background: #fff;
  flex-shrink: 0;
  width: 100%;

  @media screen and (min-width: ${Constants.breakpoints.mobile}) {
    border-bottom: 1px solid ${Constants.expoColors.gray[250]};
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    position: sticky;
    top: -57px;
    z-index: 3;
  }
`;

const SHOW_SEARCH_AND_MENU = css`
  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    top: 0px;
  }
`;

const STYLES_CONTENT = css`
  display: flex;
  align-items: flex-start;
  margin: 0 auto;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  min-height: 25%;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    height: auto;
  }
`;

const STYLES_SIDEBAR = css`
  flex-shrink: 0;
  max-width: 280px;
  height: 100%;
  overflow: hidden;
  transition: 200ms ease max-width;
  background: ${Constants.expoColors.background};

  @media screen and (max-width: 1200px) {
    max-width: 280px;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    display: none;
  }
`;

const STYLES_LEFT = css`
  border-right: 1px solid ${Constants.expoColors.gray[250]};
`;

const STYLES_RIGHT = css`
  border-left: 1px solid ${Constants.expoColors.gray[250]};
  background-color: ${Constants.expoColors.white};
`;

const STYLES_CENTER = css`
  background: ${Constants.expoColors.white};
  min-width: 5%;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    height: auto;
    overflow: auto;
  }
`;

// NOTE(jim):
// All the other components tame the UI. this one allows a container to scroll.
const STYLES_SCROLL_CONTAINER = css`
  height: 100%;
  width: 100%;
  padding-bottom: 36px;
  overflow-y: scroll;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  /* width */
  ::-webkit-scrollbar {
    width: 6px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: ${Constants.expoColors.background};
    cursor: pointer;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${Constants.expoColors.gray[200]};
    border-radius: 10px;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: ${Constants.expoColors.gray[300]};
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    overflow-y: auto;
  }
`;

const STYLES_CENTER_WRAPPER = css`
  max-width: 1200px;
  margin: auto;
`;

class ScrollContainer extends React.Component {
  scrollRef = React.createRef();

  componentDidMount() {
    if (this.props.scrollPosition && this.scrollRef.current) {
      this.scrollRef.current.scrollTop = this.props.scrollPosition;
    }
  }

  getScrollTop = () => {
    return this.scrollRef.current.scrollTop;
  };

  getScrollRef = () => {
    return this.scrollRef;
  };

  render() {
    return (
      <div
        className={STYLES_SCROLL_CONTAINER}
        ref={this.scrollRef}
        onScroll={this.props.scrollHandler}>
        {this.props.children}
      </div>
    );
  }
}

export default class DocumentationNestedScrollLayout extends React.Component {
  static defaultProps = {
    sidebarScrollPosition: 0,
  };

  sidebarRef = React.createRef();
  contentRef = React.createRef();
  sidebarRightRef = React.createRef();

  getSidebarScrollTop = () => {
    if (this.sidebarRef.current) {
      return this.sidebarRef.current.getScrollTop();
    }
  };

  getContentScrollTop = () => {
    if (!this.contentRef.current) {
      return;
    }
    return this.contentRef.current.getScrollTop();
  };

  _scrollHandler = () => {
    this.props.onContentScroll && this.props.onContentScroll(this.getContentScrollTop());
  };

  render() {
    if (this.props.isMenuActive) {
      window.scrollTo(0, 0);
    }
    return (
      <div className={STYLES_CONTAINER}>
        <div
          className={`${STYLES_HEADER} ${(this.props.isMobileSearchActive ||
            this.props.isMenuActive) &&
            SHOW_SEARCH_AND_MENU}`}>
          {this.props.header}
        </div>
        <div className={STYLES_CONTENT}>
          <div className={`${STYLES_SIDEBAR} ${STYLES_LEFT}`}>
            <ScrollContainer
              ref={this.sidebarRef}
              scrollPosition={this.props.sidebarScrollPosition}>
              {this.props.sidebar}
            </ScrollContainer>
          </div>

          <div className={STYLES_CENTER}>
            <ScrollContainer ref={this.contentRef} scrollHandler={this._scrollHandler}>
              <div className={STYLES_CENTER_WRAPPER}>{this.props.children}</div>
            </ScrollContainer>
          </div>

          {this.props.tocVisible && (
            <div className={`${STYLES_SIDEBAR} ${STYLES_RIGHT}`}>
              <ScrollContainer ref={this.sidebarRightRef}>
                {React.cloneElement(this.props.sidebarRight, {
                  selfRef: this.sidebarRightRef,
                  contentRef: this.contentRef,
                })}
              </ScrollContainer>
            </div>
          )}
        </div>
      </div>
    );
  }
}
