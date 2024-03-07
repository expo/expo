// NOTE(jim):
// GETTING NESTED SCROLL RIGHT IS DELICATE BUSINESS. THEREFORE THIS COMPONENT
// IS THE ONLY PLACE WHERE SCROLL CODE SHOULD BE HANDLED. THANKS.
import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { breakpoints } from '@expo/styleguide-base';
import * as React from 'react';

import { SidebarHead, SidebarFooter } from '~/ui/components/Sidebar';

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
    border-left: 0;
    border-right: 0;
  }

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    display: block;
    height: auto;
  }
`;

const STYLES_HEADER = css`
  flex-shrink: 0;
  width: 100%;

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    position: sticky;
    top: -57px;
    z-index: 3;
    max-height: 100vh;
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

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    height: auto;
  }
`;

const STYLES_SIDEBAR = css`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  max-width: 280px;
  height: 100%;
  overflow: hidden;
  transition: 200ms ease max-width;
  background: ${theme.background.default};

  @media screen and (max-width: 1200px) {
    max-width: 280px;
  }

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
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

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    height: auto;
    overflow: auto;
  }
`;

// NOTE(jim):
// All the other components tame the UI. this one allows a container to scroll.
const STYLES_SCROLL_CONTAINER = css`
  height: 100%;
  width: 100%;
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
    background: ${theme.palette.gray5};
  }

  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.palette.gray6};
  }

  @media screen and (max-width: ${(breakpoints.medium + breakpoints.large) / 2}px) {
    overflow-y: auto;
  }
`;

const STYLES_CENTER_WRAPPER = css`
  max-width: 1200px;
  margin: auto;
`;

const STYLES_HIDDEN = css`
  display: none;
`;

type ScrollContainerProps = React.PropsWithChildren<{
  className?: string;
  scrollPosition?: number;
  scrollHandler?: () => void;
}>;

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
      <div
        css={STYLES_SCROLL_CONTAINER}
        className={this.props.className}
        ref={this.scrollRef}
        onScroll={this.props.scrollHandler}>
        {this.props.children}
      </div>
    );
  }
}

type Props = React.PropsWithChildren<{
  onContentScroll?: (scrollTop: number) => void;
  isMobileMenuVisible: boolean;
  hideTOC: boolean;
  header: React.ReactNode;
  sidebarScrollPosition: number;
  sidebar: React.ReactNode;
  sidebarActiveGroup: string;
  sidebarRight: React.ReactElement;
}>;

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
    const {
      header,
      sidebar,
      sidebarActiveGroup,
      sidebarRight,
      sidebarScrollPosition,
      isMobileMenuVisible,
      hideTOC,
      children,
    } = this.props;

    return (
      <div css={STYLES_CONTAINER}>
        <div css={STYLES_HEADER}>{header}</div>
        <div css={STYLES_CONTENT}>
          <div css={[STYLES_SIDEBAR, STYLES_LEFT]}>
            <SidebarHead sidebarActiveGroup={sidebarActiveGroup} />
            <ScrollContainer
              ref={this.sidebarRef}
              scrollPosition={sidebarScrollPosition}
              className="pt-1.5">
              {sidebar}
              <SidebarFooter />
            </ScrollContainer>
          </div>
          <div css={[STYLES_CENTER, isMobileMenuVisible && STYLES_HIDDEN]}>
            <ScrollContainer ref={this.contentRef} scrollHandler={this.scrollHandler}>
              <div css={STYLES_CENTER_WRAPPER}>{children}</div>
            </ScrollContainer>
          </div>
          {!hideTOC && (
            <div css={[STYLES_SIDEBAR, STYLES_RIGHT]}>
              <ScrollContainer ref={this.sidebarRightRef}>
                {React.cloneElement(sidebarRight, {
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
