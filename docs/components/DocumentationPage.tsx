import { mergeClasses } from '@expo/styleguide';
import { breakpoints } from '@expo/styleguide-base';
import { useRouter } from 'next/compat/router';
import { useEffect, useState, createRef, type PropsWithChildren } from 'react';

import * as RoutesUtils from '~/common/routes';
import { appendSectionToRoute, isRouteActive } from '~/common/routes';
import * as WindowUtils from '~/common/window';
import DocumentationNestedScrollLayout from '~/components/DocumentationNestedScrollLayout';
import DocumentationSidebarRight, {
  SidebarRightComponentType,
} from '~/components/DocumentationSidebarRight';
import Head from '~/components/Head';
import { usePageApiVersion } from '~/providers/page-api-version';
import versions from '~/public/static/constants/versions.json';
import { PageMetadata } from '~/types/common';
import { Callout } from '~/ui/components/Callout';
import { Footer } from '~/ui/components/Footer';
import { Header } from '~/ui/components/Header';
import { PagePlatformTags } from '~/ui/components/PagePlatformTags';
import { PageTitle } from '~/ui/components/PageTitle';
import { Separator } from '~/ui/components/Separator';
import { Sidebar } from '~/ui/components/Sidebar';
import { versionToText } from '~/ui/components/Sidebar/ApiVersionSelect';
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
}: DocPageProps) {
  const [isMobileMenuVisible, setMobileMenuVisible] = useState(false);
  const { version } = usePageApiVersion();
  const router = useRouter();

  const layoutRef = createRef<DocumentationNestedScrollLayout>();
  const sidebarRightRef = createRef<SidebarRightComponentType>();

  const pathname = router?.pathname ?? '/';
  const routes = RoutesUtils.getRoutes(pathname, version);
  const sidebarActiveGroup = RoutesUtils.getPageSection(pathname);
  const sidebarScrollPosition = process.browser ? window.__sidebarScroll : 0;

  useEffect(() => {
    router?.events.on('routeChangeStart', url => {
      if (layoutRef.current) {
        if (
          RoutesUtils.getPageSection(pathname) !== RoutesUtils.getPageSection(url) ||
          pathname === '/'
        ) {
          window.__sidebarScroll = 0;
        } else {
          window.__sidebarScroll = layoutRef.current.getSidebarScrollTop();
        }
      }
    });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const handleResize = () => {
    if (WindowUtils.getViewportSize().width >= breakpoints.medium + 124) {
      setMobileMenuVisible(false);
      window.scrollTo(0, 0);
    }
  };

  const handleContentScroll = (contentScrollPosition: number) => {
    window.requestAnimationFrame(() => {
      if (sidebarRightRef && sidebarRightRef.current) {
        sidebarRightRef.current.handleContentScroll(contentScrollPosition);
      }
    });
  };

  const sidebarElement = <Sidebar routes={routes} />;
  const sidebarRightElement = <DocumentationSidebarRight ref={sidebarRightRef} />;
  const headerElement = (
    <Header
      sidebar={sidebarElement}
      sidebarActiveGroup={sidebarActiveGroup}
      isMobileMenuVisible={isMobileMenuVisible}
      setMobileMenuVisible={newState => setMobileMenuVisible(newState)}
    />
  );

  const flattenStructure = routes
    .map(route => appendSectionToRoute(route))
    .flat()
    .map(route => (route?.type === 'page' ? route : appendSectionToRoute(route)))
    .flat();

  const pageIndex = flattenStructure.findIndex(page =>
    isRouteActive(page, router?.asPath, router?.pathname)
  );

  const previousPage = flattenStructure[pageIndex - 1];
  const nextPage = flattenStructure[pageIndex + 1];

  return (
    <DocumentationNestedScrollLayout
      ref={layoutRef}
      header={headerElement}
      sidebar={sidebarElement}
      sidebarRight={sidebarRightElement}
      sidebarActiveGroup={sidebarActiveGroup}
      hideTOC={hideTOC ?? false}
      isMobileMenuVisible={isMobileMenuVisible}
      onContentScroll={handleContentScroll}
      sidebarScrollPosition={sidebarScrollPosition}>
      <Head
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
      </Head>
      <div
        className={mergeClasses(
          'mx-auto px-14 py-10',
          'max-lg-gutters:px-4 max-lg-gutters:pb-12 max-lg-gutters:pt-5'
        )}>
        {version && version === 'unversioned' && (
          <Callout type="default" size="sm" className="!mb-5 !inline-flex w-full">
            This is documentation for the next SDK version. For up-to-date documentation, see the{' '}
            <A href={pathname.replace('unversioned', 'latest')}>latest version</A> (
            {versionToText(LATEST_VERSION)}).
          </Callout>
        )}
        {title && (
          <PageTitle
            title={title}
            description={description}
            sourceCodeUrl={sourceCodeUrl}
            packageName={packageName}
            iconUrl={iconUrl}
          />
        )}
        {platforms && <PagePlatformTags platforms={platforms} />}
        {title && <Separator />}
        {children}
        <Footer
          title={title}
          sourceCodeUrl={sourceCodeUrl}
          packageName={packageName}
          previousPage={previousPage}
          nextPage={nextPage}
          modificationDate={modificationDate}
        />
      </div>
    </DocumentationNestedScrollLayout>
  );
}
