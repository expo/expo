import { Button, mergeClasses } from '@expo/styleguide';
import { ChevronLeftIcon } from '@expo/styleguide-icons/outline/ChevronLeftIcon';
import { ChevronRightIcon } from '@expo/styleguide-icons/outline/ChevronRightIcon';
import {
  Component,
  cloneElement,
  createRef,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from 'react';

import { ScrollContainer } from '~/components/ScrollContainer';
import { SidebarFooter } from '~/ui/components/Sidebar/SidebarFooter';
import { SidebarHead } from '~/ui/components/Sidebar/SidebarHead';
import { TableOfContentsProps } from '~/ui/components/TableOfContents';

type Props = PropsWithChildren<{
  onContentScroll?: (scrollTop: number) => void;
  isMobileMenuVisible: boolean;
  hideTOC: boolean;
  header: ReactNode;
  sidebarScrollPosition: number;
  sidebar: ReactNode;
  sidebarActiveGroup: string;
  sidebarRight: ReactElement<TableOfContentsProps>;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
  isChatExpanded?: boolean;
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
      onSidebarToggle,
      isSidebarCollapsed = false,
      isChatExpanded = false,
    } = this.props;

    return (
      <div className="mx-auto flex h-dvh w-full flex-col overflow-hidden">
        <div className="max-lg-gutters:sticky">{header}</div>
        <div className="mx-auto flex h-[calc(100dvh-60px)] w-full items-center justify-between">
          <div className="relative h-full max-lg-gutters:hidden">
            {onSidebarToggle ? (
              <div
                className={mergeClasses(
                  'absolute z-20 flex items-center justify-center transition-all duration-200 ease-out',
                  'bottom-6',
                  isSidebarCollapsed ? 'left-5 translate-x-0' : 'left-[280px] -translate-x-1/2'
                )}>
                <Button
                  type="button"
                  theme="quaternary"
                  size="xs"
                  className={mergeClasses(
                    'inline-flex size-9 items-center justify-center rounded-full border !p-0 transition-colors duration-150 ease-out',
                    'shadow-sm',
                    isSidebarCollapsed
                      ? 'border-palette-gray5 bg-palette-gray4 text-icon-secondary dark:border-palette-gray6 dark:bg-palette-gray5'
                      : 'border-default bg-default text-icon-secondary',
                    'hover:bg-element focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-blue9'
                  )}
                  aria-label={isSidebarCollapsed ? 'Show navigation' : 'Hide navigation'}
                  title={isSidebarCollapsed ? 'Show navigation' : 'Hide navigation'}
                  aria-pressed={!isSidebarCollapsed}
                  onClick={onSidebarToggle}>
                  {isSidebarCollapsed ? (
                    <ChevronRightIcon className="icon-sm" />
                  ) : (
                    <ChevronLeftIcon className="icon-sm" />
                  )}
                  <span className="sr-only">
                    {isSidebarCollapsed ? 'Show navigation' : 'Hide navigation'}
                  </span>
                </Button>
              </div>
            ) : null}
            <div
              className={mergeClasses(
                'flex h-full max-w-[280px] flex-col overflow-hidden border-r border-r-default transition-[max-width,opacity,width] duration-200 ease-out',
                isSidebarCollapsed
                  ? 'w-0 max-w-0 border-r-0 opacity-0'
                  : 'w-[280px] max-w-[280px] opacity-100'
              )}>
              {isSidebarCollapsed ? null : (
                <>
                  <SidebarHead sidebarActiveGroup={sidebarActiveGroup} />
                  <ScrollContainer
                    ref={this.sidebarRef}
                    scrollPosition={sidebarScrollPosition}
                    className="pt-1.5">
                    {sidebar}
                    <SidebarFooter />
                  </ScrollContainer>
                </>
              )}
            </div>
          </div>
          <div
            className={mergeClasses(
              'relative flex h-[calc(100dvh-60px)] w-full overflow-hidden',
              'max-lg-gutters:overflow-auto',
              isMobileMenuVisible && 'hidden'
            )}>
            <ScrollContainer ref={this.contentRef} scrollHandler={this.scrollHandler}>
              <div
                className={mergeClasses(
                  'mx-auto max-w-screen-xl transition-[padding,max-width,margin] duration-200 ease-out',
                  isChatExpanded &&
                    'lg:pr-[360px] lg:pl-8 lg:max-w-[calc(100%-360px)] max-lg-gutters:max-w-screen-xl max-lg-gutters:pl-0 max-lg-gutters:pr-0'
                )}>
                {children}
              </div>
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

  private readonly scrollHandler = () => {
    this.props.onContentScroll && this.props.onContentScroll(this.getContentScrollTop());
  };
}
