import { mergeClasses } from '@expo/styleguide';
import {
  Component,
  cloneElement,
  createRef,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from 'react';

import { ScrollContainer } from '~/components/ScrollContainer';
import { SidebarHead, SidebarFooter } from '~/ui/components/Sidebar';

type Props = PropsWithChildren<{
  onContentScroll?: (scrollTop: number) => void;
  isMobileMenuVisible: boolean;
  hideTOC: boolean;
  header: ReactNode;
  sidebarScrollPosition: number;
  sidebar: ReactNode;
  sidebarActiveGroup: string;
  sidebarRight: ReactElement;
}>;

export default class DocumentationNestedScrollLayout extends Component<Props> {
  static defaultProps = {
    sidebarScrollPosition: 0,
  };

  sidebarRef = createRef<ScrollContainer>();
  contentRef = createRef<ScrollContainer>();
  sidebarRightRef = createRef<ScrollContainer>();

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
      <div className="mx-auto flex h-dvh w-full flex-col overflow-hidden">
        <div className="max-lg-gutters:sticky">{header}</div>
        <div className="mx-auto flex h-[calc(100vh-60px)] w-full items-center justify-between">
          <div
            className={mergeClasses(
              'flex h-full max-w-[280px] shrink-0 flex-col overflow-hidden border-r border-r-default',
              'max-lg-gutters:hidden'
            )}>
            <SidebarHead sidebarActiveGroup={sidebarActiveGroup} />
            <ScrollContainer
              ref={this.sidebarRef}
              scrollPosition={sidebarScrollPosition}
              className="pt-1.5">
              {sidebar}
              <SidebarFooter />
            </ScrollContainer>
          </div>
          <div
            className={mergeClasses(
              'flex h-[calc(100vh-60px)] w-full overflow-hidden',
              'max-lg-gutters:overflow-auto',
              isMobileMenuVisible && 'hidden'
            )}>
            <ScrollContainer ref={this.contentRef} scrollHandler={this.scrollHandler}>
              <div className="mx-auto max-w-screen-xl">{children}</div>
            </ScrollContainer>
          </div>
          {!hideTOC && (
            <div
              className={mergeClasses(
                'flex h-[calc(100dvh-60px)] max-w-[280px] shrink-0 flex-col overflow-hidden border-l border-l-default',
                'max-xl-gutters:hidden'
              )}>
              <ScrollContainer ref={this.sidebarRightRef}>
                {cloneElement(sidebarRight, {
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
