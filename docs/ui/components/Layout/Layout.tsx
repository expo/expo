import { mergeClasses } from '@expo/styleguide';
import { type PropsWithChildren, type ReactNode } from 'react';

import { Sidebar } from '../Sidebar';

import { Header } from '~/ui/components/Header';
import { LayoutScroll } from '~/ui/components/Layout';

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
    <>
      <header className="fixed top-0 w-full h-[60px] z-[100]">{header}</header>
      <main
        className={mergeClasses('flex items-stretch mt-[60px]', 'max-md-gutters:max-h-[unset]')}>
        {navigation && <nav className="basis-[256px] max-md-gutters:hidden">{navigation}</nav>}
        <LayoutScroll>
          <article
            className={mergeClasses(
              'mx-auto min-h-[calc(100vh-60px)] max-w-screen-lg py-8 px-4',
              className
            )}>
            {children}
          </article>
        </LayoutScroll>
        {sidebar && <aside className="basis-[288px] max-md-gutters:hidden">{sidebar}</aside>}
      </main>
    </>
  );
}
