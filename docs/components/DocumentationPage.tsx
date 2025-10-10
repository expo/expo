import { mergeClasses } from '@expo/styleguide';
import { breakpoints } from '@expo/styleguide-base';
import { useRouter } from 'next/compat/router';
import { useEffect, useState, createRef, type PropsWithChildren, useRef } from 'react';

import { InlineHelp } from 'ui/components/InlineHelp';
import { PageHeader } from 'ui/components/PageHeader';
import * as RoutesUtils from '~/common/routes';
import { appendSectionToRoute, isRouteActive } from '~/common/routes';
import { versionToText } from '~/common/utilities';
import * as WindowUtils from '~/common/window';
import DocumentationHead from '~/components/DocumentationHead';
import DocumentationNestedScrollLayout from '~/components/DocumentationNestedScrollLayout';
import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { PageMetadata } from '~/types/common';
import { AskPageAIOverlay } from '~/ui/components/AskPageAI';
import { Footer } from '~/ui/components/Footer';
import { Header } from '~/ui/components/Header';
import { Separator } from '~/ui/components/Separator';
import { Sidebar } from '~/ui/components/Sidebar/Sidebar';
import {
  TableOfContentsHandles,
  TableOfContentsWithManager,
} from '~/ui/components/TableOfContents';
import { A } from '~/ui/components/Text';

const { LATEST_VERSION } = versions;

export type DocPageProps = PropsWithChildren<PageMetadata>;

export default function DocumentationPage({
  title,
  description,
  packageName,
  sourceCodeUrl,
  iconUrl,
  children,
  hideFromSearch,
  platforms,
  hideTOC,
  modificationDate,
  searchRank,
  searchPosition,
}: DocPageProps) {
  const [isMobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [isAskAIVisible, setAskAIVisible] = useState(false);
  const { version } = usePageApiVersion();
  const router = useRouter();

  const layoutRef = createRef<DocumentationNestedScrollLayout>();
  const tableOfContentsRef = useRef<TableOfContentsHandles>(null);

  const pathname = router?.pathname ?? '/';
  const routes = RoutesUtils.getRoutes(pathname, version);
  const sidebarActiveGroup = RoutesUtils.getPageSection(pathname);
  const sidebarScrollPosition = process?.browser ? window.__sidebarScroll : 0;
  const currentPath = router?.asPath ?? '';
  const isLatestSdkPage = currentPath.startsWith('/versions/latest/sdk/');
  const isLatestConfigPage = currentPath.startsWith('/versions/latest/config/');
  const isAskAIEligiblePage = isLatestSdkPage || isLatestConfigPage;
  const askAIButtonVariant = isLatestConfigPage ? 'config' : 'default';

  useEffect(() => {
    if (!isAskAIEligiblePage && isAskAIVisible) {
      setAskAIVisible(false);
    }
  }, [isAskAIEligiblePage, isAskAIVisible]);

  const handleAskAIChatClose = () => {
    setAskAIVisible(false);
  };
  const handleAskAIMinimize = () => {
    setAskAIVisible(false);
  };
  const handleAskAIToggle = () => {
    if (!isAskAIEligiblePage) {
      return;
    }

    setAskAIVisible(previous => !previous);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.sessionStorage.getItem('expo-docs-ask-ai-visible');
    if (stored === 'true') {
      setAskAIVisible(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.sessionStorage.setItem('expo-docs-ask-ai-visible', String(isAskAIVisible));
  }, [isAskAIVisible]);

  useEffect(() => {
    if (!layoutRef.current) {
      return;
    }

    layoutRef.current.contentRef.current?.getScrollRef().current?.focus();

    const handleRouteChangeStart = (url: string) => {
      if (
        RoutesUtils.getPageSection(pathname) !== RoutesUtils.getPageSection(url) ||
        pathname === '/' ||
        !layoutRef.current
      ) {
        window.__sidebarScroll = 0;
      } else {
        window.__sidebarScroll = layoutRef.current.getSidebarScrollTop();
      }
    };

    router?.events.on('routeChangeStart', handleRouteChangeStart);
    window.addEventListener('resize', handleResize);

    return () => {
      router?.events.off('routeChangeStart', handleRouteChangeStart);
      window.removeEventListener('resize', handleResize);
    };
  }, [layoutRef, tableOfContentsRef, router?.events, pathname]);

  const handleResize = () => {
    if (WindowUtils.getViewportSize().width >= breakpoints.medium + 124) {
      setMobileMenuVisible(false);
      window.scrollTo(0, 0);
    }
  };

  const handleContentScroll = (contentScrollPosition: number) => {
    window.requestAnimationFrame(() => {
      if (tableOfContentsRef.current?.handleContentScroll) {
        tableOfContentsRef.current.handleContentScroll(contentScrollPosition);
      }
    });
  };

  const sidebarElement = <Sidebar routes={routes} />;
  const headerElement = (
    <Header
      sidebar={sidebarElement}
      sidebarActiveGroup={sidebarActiveGroup}
      isMobileMenuVisible={isMobileMenuVisible}
      setMobileMenuVisible={newState => {
        setMobileMenuVisible(newState);
      }}
    />
  );

  const flattenStructure = routes
    .map(route => appendSectionToRoute(route))
    .flat()
    .map(route => {
      if (route?.type === 'page') {
        return route;
      } else {
        const sectionRoutes = appendSectionToRoute(route);
        if (Array.isArray(sectionRoutes)) {
          return sectionRoutes
            .map(subRoute =>
              subRoute?.type === 'page' ? subRoute : appendSectionToRoute(subRoute)
            )
            .flat();
        }
        return sectionRoutes;
      }
    })
    .flat();

  const pageIndex = flattenStructure.findIndex(page =>
    isRouteActive(page, router?.asPath, router?.pathname)
  );

  const previousPage = flattenStructure[pageIndex - 1];
  const nextPage = flattenStructure[pageIndex + 1];

  const hideSidebarRight = hideTOC ?? false;

  return (
    <>
      <DocumentationNestedScrollLayout
        ref={layoutRef}
        header={headerElement}
        sidebar={sidebarElement}
        sidebarRight={<TableOfContentsWithManager ref={tableOfContentsRef} />}
        sidebarActiveGroup={sidebarActiveGroup}
        hideTOC={hideSidebarRight}
        isMobileMenuVisible={isMobileMenuVisible}
        onContentScroll={handleContentScroll}
        sidebarScrollPosition={sidebarScrollPosition}>
        <DocumentationHead
          title={title}
          description={description}
          canonicalUrl={
            version !== 'unversioned' ? RoutesUtils.getCanonicalUrl(pathname) : undefined
          }>
          {hideFromSearch !== true && (
            <meta
              name="docsearch:version"
              content={RoutesUtils.isReferencePath(pathname) ? version : 'none'}
            />
          )}
          {(version === 'unversioned' ||
            RoutesUtils.isPreviewPath(pathname) ||
            RoutesUtils.isArchivePath(pathname)) && <meta name="robots" content="noindex" />}
          {searchRank && <meta name="searchRank" content={String(searchRank)} />}
          {searchPosition && <meta name="searchPosition" content={String(searchPosition)} />}
        </DocumentationHead>
        <div
          className={mergeClasses(
            'pointer-events-none absolute z-10 h-8 w-[calc(100%-6px)] max-w-screen-xl',
            'bg-gradient-to-b from-default to-transparent opacity-90'
          )}
        />
        <main
          className={mergeClasses(
            'mx-auto px-14 pt-10',
            'max-lg-gutters:px-4 max-lg-gutters:pt-5'
          )}>
          {version && version === 'unversioned' && (
            <InlineHelp type="default" size="sm" className="!mb-5 !inline-flex w-full">
              This is documentation for the next SDK version. For up-to-date documentation, see the{' '}
              <A href={pathname.replace('unversioned', 'latest')}>latest version</A> (
              {versionToText(LATEST_VERSION)}).
            </InlineHelp>
          )}
          {title && (
            <PageHeader
              title={title}
              description={description}
              sourceCodeUrl={sourceCodeUrl}
              packageName={packageName}
              iconUrl={iconUrl}
              platforms={platforms}
              showAskAIButton={isAskAIEligiblePage}
              onAskAIClick={handleAskAIToggle}
              isAskAIVisible={isAskAIVisible}
              askAIButtonVariant={askAIButtonVariant}
            />
          )}
          {title && <Separator />}
          {children}
        </main>
        <Footer
          title={title}
          sourceCodeUrl={sourceCodeUrl}
          packageName={packageName}
          previousPage={previousPage}
          nextPage={nextPage}
          modificationDate={modificationDate}
        />
      </DocumentationNestedScrollLayout>
      {isAskAIEligiblePage && (
        <AskPageAIOverlay
          onClose={handleAskAIChatClose}
          onMinimize={handleAskAIMinimize}
          pageTitle={title}
          isExpoSdkPage={isLatestSdkPage}
          isVisible={isAskAIVisible}
        />
      )}
    </>
  );
}
