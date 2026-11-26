import { Button, mergeClasses } from '@expo/styleguide';
import { LayoutLeftIcon } from '@expo/styleguide-icons/outline/LayoutLeftIcon';
import {
  cloneElement,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { ScrollContainer, type ScrollContainerHandle } from '~/components/ScrollContainer';
import { ThemeSelector } from '~/ui/components/Header/ThemeSelector';
import { SidebarFooter } from '~/ui/components/Sidebar/SidebarFooter';
import { SidebarHead } from '~/ui/components/Sidebar/SidebarHead';
import { SidebarTop } from '~/ui/components/Sidebar/SidebarTop';
import { TableOfContentsProps } from '~/ui/components/TableOfContents';
import * as Tooltip from '~/ui/components/Tooltip';

type Props = PropsWithChildren<{
  onContentScroll?: (scrollTop: number) => void;
  isMobileMenuVisible: boolean;
  hideTOC: boolean;
  header: ReactNode;
  sidebarScrollPosition?: number;
  sidebar: ReactNode;
  sidebarActiveGroup: string;
  sidebarRight: ReactElement<TableOfContentsProps>;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
  isChatExpanded?: boolean;
  layoutRef?: { current: DocumentationNestedScrollLayoutHandles | null } | null;
}>;

export type DocumentationNestedScrollLayoutHandles = {
  getSidebarScrollTop: () => number;
  getContentScrollTop: () => number;
  contentRef: { current: ScrollContainerHandle | null };
};

export default function DocumentationNestedScrollLayout({
  header,
  sidebar,
  sidebarActiveGroup,
  sidebarRight,
  sidebarScrollPosition = 0,
  isMobileMenuVisible,
  hideTOC,
  children,
  onSidebarToggle,
  isSidebarCollapsed = false,
  isChatExpanded = false,
  onContentScroll,
  layoutRef,
}: Props) {
  const sidebarRef = useRef<ScrollContainerHandle | null>(null);
  const contentRef = useRef<ScrollContainerHandle | null>(null);
  const sidebarRightRef = useRef<ScrollContainerHandle | null>(null);
  const [isMounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getSidebarScrollTop = useCallback(() => sidebarRef.current?.getScrollTop() ?? 0, []);
  const getContentScrollTop = useCallback(() => contentRef.current?.getScrollTop() ?? 0, []);

  useEffect(() => {
    if (!layoutRef) {
      return;
    }
    layoutRef.current = {
      getSidebarScrollTop,
      getContentScrollTop,
      contentRef,
    };
    return () => {
      layoutRef.current = null;
    };
  }, [layoutRef, getSidebarScrollTop, getContentScrollTop]);

  useEffect(() => {
    // pages/_document.tsx adds the ios-webkit class.
    if (!document.documentElement.classList.contains('ios-webkit')) {
      return;
    }
    // overflow: hidden on the root does not stop hash links and scrollIntoView from scrolling
    // the document and hiding the header. The keyboard and zoom need the document scroll.
    const resetDocumentScroll = () => {
      if (
        window.scrollY === 0 ||
        (window.visualViewport?.scale ?? 1) > 1 ||
        isEditableElement(document.activeElement)
      ) {
        return;
      }
      window.scrollTo(0, 0);
    };
    resetDocumentScroll();
    window.addEventListener('scroll', resetDocumentScroll);
    return () => {
      window.removeEventListener('scroll', resetDocumentScroll);
    };
  }, []);

  const scrollHandler = () => {
    if (onContentScroll) {
      onContentScroll(getContentScrollTop());
    }
  };

  return (
    <div
      data-nested-scroll-layout
      className="mx-auto flex h-(--nested-scroll-layout-height) w-full flex-col overflow-hidden lg:bg-subtle">
      <div className="lg:hidden max-lg:sticky">{header}</div>
      <div
        className={mergeClasses(
          'mx-auto flex h-[calc(100dvh-60px)] w-full items-center justify-between',
          'lg:h-(--nested-scroll-layout-height) lg:px-4 lg:pt-1 lg:pb-4',
          'lg:[reading-flow:grid-rows] lg:grid lg:grid-rows-1',
          isMounted ? 'lg:grid-cols-[auto_minmax(0,1fr)]' : 'lg:grid-cols-[15.625rem_minmax(0,1fr)]'
        )}>
        <div
          className={mergeClasses(
            'flex h-[calc(var(--nested-scroll-layout-height)-60px)] w-full self-start overflow-hidden',
            'lg:col-start-2 lg:row-start-1 lg:h-[calc(var(--nested-scroll-layout-height)-1.25rem)] lg:rounded-lg lg:bg-default lg:relative lg:shadow-sm lg:after:pointer-events-none lg:after:absolute lg:after:inset-0 lg:after:rounded-[inherit] lg:after:border-[0.5px] lg:after:border-(--expo-theme-border-secondary)',
            isMobileMenuVisible && 'hidden'
          )}>
          <div className="relative flex h-full min-w-0 flex-1 overflow-hidden max-lg:overflow-auto">
            <ScrollContainer
              ref={contentRef}
              scrollHandler={scrollHandler}
              className="scrollbar-none [&::-webkit-scrollbar]:hidden">
              <div
                className={mergeClasses(
                  'mx-auto max-w-screen-xl pb-[calc(var(--nested-scroll-layout-height)-100dvh)] transition-[padding,max-width,margin] duration-200 ease-out will-change-[padding,max-width,margin]',
                  !hideTOC && 'xl:mr-20 xl:ml-auto xl:max-w-168',
                  isChatExpanded && 'max-lg:max-w-screen-xl max-lg:pr-0 max-lg:pl-0'
                )}>
                {children}
              </div>
            </ScrollContainer>
          </div>
          {!hideTOC && (
            <div className="flex h-full w-[calc((100%-60rem)/2+13rem)] shrink-0 flex-col overflow-hidden max-xl:hidden">
              <ScrollContainer
                ref={sidebarRightRef}
                className="scrollbar-none [&::-webkit-scrollbar]:hidden">
                {cloneElement(sidebarRight, {
                  selfRef: sidebarRightRef,
                  contentRef,
                })}
              </ScrollContainer>
            </div>
          )}
        </div>
        <div className="relative h-full lg:col-start-1 lg:row-start-1 max-lg:hidden">
          {onSidebarToggle && isSidebarCollapsed ? (
            <div className="absolute bottom-6 left-2 z-20 flex items-center justify-center">
              <Tooltip.Root delayDuration={300}>
                <Tooltip.Trigger asChild>
                  <Button
                    type="button"
                    theme="quaternary"
                    size="xs"
                    className={mergeClasses(
                      'inline-flex size-9 items-center justify-center rounded-full border p-0! transition-colors duration-150 ease-out',
                      'shadow-sm',
                      'border-palette-gray5 bg-palette-gray4 text-icon-secondary dark:border-palette-gray6 dark:bg-palette-gray5',
                      'hover:bg-element focus-visible:ring-2 focus-visible:ring-palette-blue9 focus-visible:outline-none'
                    )}
                    aria-label="Show navigation"
                    title="Show navigation"
                    aria-pressed={false}
                    onClick={onSidebarToggle}>
                    <LayoutLeftIcon aria-hidden="true" className="icon-sm" />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content sideOffset={8} className="max-w-65 text-center text-sm">
                  Use Cmd/Ctrl + Shift + Enter to toggle immersive mode.
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
          ) : null}
          <div
            className={mergeClasses(
              'flex h-full flex-col overflow-hidden transition-[max-width,opacity,width,margin] duration-200 ease-out will-change-[max-width,width,opacity,margin]',
              isSidebarCollapsed
                ? 'mr-0 w-0 max-w-0 opacity-0'
                : 'mr-4 w-58.5 max-w-58.5 opacity-100'
            )}>
            {isSidebarCollapsed ? null : (
              <>
                <SidebarTop
                  subgroup={sidebarActiveGroup === 'archive' ? 'Archive' : undefined}
                  onCollapse={onSidebarToggle}
                />
                <SidebarHead sidebarActiveGroup={sidebarActiveGroup} />
                <ScrollContainer
                  ref={sidebarRef}
                  scrollPosition={sidebarScrollPosition}
                  className="scrollbar-none pt-1.5 [&::-webkit-scrollbar]:hidden">
                  {sidebar}
                  <SidebarFooter />
                </ScrollContainer>
                <div className="mt-px shrink-0">
                  <ThemeSelector
                    ariaLabel="Theme selector (sidebar)"
                    inactiveIconClassName="text-palette-gray8 dark:text-icon-secondary"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function isEditableElement(element: Element | null) {
  return (
    element instanceof HTMLElement &&
    (element.isContentEditable || element.matches('input, textarea, select'))
  );
}
