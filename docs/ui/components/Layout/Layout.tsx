import { mergeClasses } from '@expo/styleguide';
import { type PropsWithChildren, type ReactNode } from 'react';

import { Header } from '~/ui/components/Header';
import { ThemeSelector } from '~/ui/components/Header/ThemeSelector';
import { Sidebar } from '~/ui/components/Sidebar/Sidebar';
import { SidebarFooter } from '~/ui/components/Sidebar/SidebarFooter';
import { SidebarHead } from '~/ui/components/Sidebar/SidebarHead';
import { SidebarTop } from '~/ui/components/Sidebar/SidebarTop';

import { LayoutScroll } from './LayoutScroll';

type LayoutProps = PropsWithChildren<{
  /**
   * The content within the top bar that spans the columns.
   */
  header?: ReactNode;
  /**
   * The content within the left column.
   */
  navigation?: ReactNode;
  /**
   * The content within the right column.
   */
  sidebar?: ReactNode;
  /**
   * Custom className for the main content wrapper.
   */
  className?: string;
}>;

export function Layout({
  // note(simek): stub props for now, until we don't use new Layout
  header = (
    <Header
      sidebar={<Sidebar />}
      sidebarActiveGroup="home"
      isMobileMenuVisible={false}
      setMobileMenuVisible={() => undefined}
    />
  ),
  navigation,
  sidebar,
  children,
  className,
}: LayoutProps) {
  return (
    <div className="lg:flex lg:h-dvh lg:gap-4 lg:bg-subtle lg:px-4 lg:pt-1 lg:pb-4">
      <header className="fixed top-0 z-100 h-[60px] w-full lg:hidden">{header}</header>
      <div className="flex w-58.5 shrink-0 flex-col max-lg:hidden">
        <SidebarTop />
        <SidebarHead sidebarActiveGroup="home" />
        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <SidebarFooter />
        </div>
        <div className="shrink-0 border-t border-default py-3">
          <ThemeSelector />
        </div>
      </div>
      <main
        className={mergeClasses(
          'mt-15 flex items-stretch',
          'lg:mt-0 lg:min-w-0 lg:flex-1 lg:overflow-hidden lg:rounded-lg lg:border-0.5 lg:border-secondary lg:bg-default lg:shadow-sm',
          'max-md:max-h-[unset]'
        )}>
        {navigation && <nav className="basis-[256px] max-md:hidden">{navigation}</nav>}
        <LayoutScroll>
          <article
            className={mergeClasses(
              'mx-auto min-h-[calc(100vh-60px)] max-w-screen-lg px-4 py-8 lg:min-h-full',
              className
            )}>
            {children}
          </article>
        </LayoutScroll>
        {sidebar && <aside className="basis-[288px] max-md:hidden">{sidebar}</aside>}
      </main>
    </div>
  );
}
