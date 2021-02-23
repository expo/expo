// NOTE(jim):
// GETTING NESTED SCROLL RIGHT IS DELICATE BUSINESS. THEREFORE THIS COMPONENT
// IS THE ONLY PLACE WHERE SCROLL CODE SHOULD BE HANDLED. THANKS.
import { Global, css } from '@emotion/core';
import { theme } from '@expo/styleguide';
import * as React from 'react';

import * as Constants from '~/constants/theme';

const STYLES_GLOBAL = css`
  html {
    background: ${theme.background.default};
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    html {
      /* width */
      ::-webkit-scrollbar {
        width: 6px;
      }

      /* Track */
      ::-webkit-scrollbar-track {
        background: ${theme.background.default};
      }

      /* Handle */
      ::-webkit-scrollbar-thumb {
        background: ${theme.background.tertiary};
        border-radius: 10px;
      }

      /* Handle on hover */
      ::-webkit-scrollbar-thumb:hover {
        background: ${theme.background.quaternary};
      }
    }
  }
`;

const STYLES_CONTAINER = css`
  width: 100%;
  height: 100vh;
  overflow: hidden;
  margin: 0 auto 0 auto;
  border-right: 1px solid ${theme.border.default};
  background: ${theme.background.default};

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
  flex-shrink: 0;
  width: 100%;

  @media screen and (min-width: ${Constants.breakpoints.mobile}) {
    border-bottom: 1px solid ${theme.border.default};
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
  background: ${theme.background.canvas};

  @media screen and (max-width: 1200px) {
    max-width: 280px;
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    display: none;
  }
`;

const STYLES_LEFT = css`
  border-right: 1px solid ${theme.border.default};
`;

const STYLES_RIGHT = css`
  border-left: 1px solid ${theme.border.default};
  background-color: ${theme.background.default};
`;

const STYLES_CENTER = css`
  background: ${theme.background.default};
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
    background: transparent;
    cursor: pointer;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${theme.background.tertiary};
    border-radius: 10px;
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.background.quaternary};
  }

  @media screen and (max-width: ${Constants.breakpoints.mobile}) {
    overflow-y: auto;
  }
`;

const STYLES_CENTER_WRAPPER = css`
  max-width: 1200px;
  margin: auto;
`;

type ScrollContainerProps = {
  scrollPosition?: number;
  scrollHandler?: () => void;
};

class ScrollContainer extends React.Component<ScrollContainerProps> {
  scrollRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    if (this.props.scrollPosition && this.scrollRef.current) {
      this.scrollRef.current.scrollTop = this.props.scrollPosition;
    }
  }

  public getScrollTop = () => {
    return this.scrollRef.current?.scrollTop ?? 0;
  };

  public getScrollRef = () => {
    return this.scrollRef;
  };

  render() {
    return (
      <div css={STYLES_SCROLL_CONTAINER} ref={this.scrollRef} onScroll={this.props.scrollHandler}>
        {this.props.children}
      </div>
    );
  }
}

type Props = {
  onContentScroll?: (scrollTop: number) => void;
  isMenuActive: boolean;
  tocVisible: boolean;
  isMobileSearchActive: boolean;
  header: React.ReactNode;
  sidebarScrollPosition: number;
  sidebar: React.ReactNode;
  sidebarRight: React.ReactElement;
};

export default class DocumentationNestedScrollLayout extends React.Component<Props> {
  static defaultProps = {
    sidebarScrollPosition: 0,
  };

  sidebarRef = React.createRef<ScrollContainer>();
  contentRef = React.createRef<ScrollContainer>();
  sidebarRightRef = React.createRef<ScrollContainer>();

  public getSidebarScrollTop = () => {
    return this.sidebarRef.current?.getScrollTop() ?? 0;
  };

  public getContentScrollTop = () => {
    return this.contentRef.current?.getScrollTop() ?? 0;
  };

  render() {
    const { isMobileSearchActive, isMenuActive, sidebarScrollPosition } = this.props;

    if (isMenuActive) {
      window.scrollTo(0, 0);
    }

    return (
      <div css={STYLES_CONTAINER}>
        <Global styles={STYLES_GLOBAL} />
        <div css={[STYLES_HEADER, (isMobileSearchActive || isMenuActive) && SHOW_SEARCH_AND_MENU]}>
          {this.props.header}
        </div>
        <div css={STYLES_CONTENT}>
          <div css={[STYLES_SIDEBAR, STYLES_LEFT]}>
            <ScrollContainer ref={this.sidebarRef} scrollPosition={sidebarScrollPosition}>
              {this.props.sidebar}
            </ScrollContainer>
          </div>

          <div css={STYLES_CENTER}>
            <ScrollContainer ref={this.contentRef} scrollHandler={this.scrollHandler}>
              <div css={STYLES_CENTER_WRAPPER}>{this.props.children}</div>
            </ScrollContainer>
          </div>

          {this.props.tocVisible && (
            <div css={[STYLES_SIDEBAR, STYLES_RIGHT]}>
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

  private scrollHandler = () => {
    this.props.onContentScroll && this.props.onContentScroll(this.getContentScrollTop());
  };
}
