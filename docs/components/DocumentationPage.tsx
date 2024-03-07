import { css } from '@emotion/react';
import { theme } from '@expo/styleguide';
import { breakpoints } from '@expo/styleguide-base';
import { useRouter } from 'next/compat/router';
import { useEffect, useState, createRef, type PropsWithChildren } from 'react';

import * as RoutesUtils from '~/common/routes';
import { isRouteActive } from '~/common/routes';
import * as WindowUtils from '~/common/window';
import DocumentationNestedScrollLayout from '~/components/DocumentationNestedScrollLayout';
import DocumentationSidebarRight, {
  SidebarRightComponentType,
} from '~/components/DocumentationSidebarRight';
import Head from '~/components/Head';
import { usePageApiVersion } from '~/providers/page-api-version';
import { NavigationRouteWithSection, PageMetadata } from '~/types/common';
import { Footer } from '~/ui/components/Footer';
import { Header } from '~/ui/components/Header';
import { PageTitle } from '~/ui/components/PageTitle';
import { Separator } from '~/ui/components/Separator';
import { Sidebar } from '~/ui/components/Sidebar';
import { Tag } from '~/ui/components/Tag';
import { FOOTNOTE, P } from '~/ui/components/Text';
import * as Tooltip from '~/ui/components/Tooltip';

const STYLES_DOCUMENT = css`
  background: ${theme.background.default};
  margin: 0 auto;
  padding: 40px 56px;

  @media screen and (max-width: ${breakpoints.medium + 124}px) {
    padding: 20px 16px 48px 16px;
  }
`;

export type DocPageProps = PropsWithChildren<PageMetadata>;

function appendSectionToRoute(route?: NavigationRouteWithSection) {
  if (route?.children) {
    return route.children.map((entry: NavigationRouteWithSection) =>
      route.type !== 'page'
        ? Object.assign(entry, {
            section: route.section ? `${route.section} - ${route.name}` : route.name,
          })
        : route
    );
  }
  return route;
}

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
      <div css={STYLES_DOCUMENT}>
        {title && (
          <PageTitle
            title={title}
            sourceCodeUrl={sourceCodeUrl}
            packageName={packageName}
            iconUrl={iconUrl}
          />
        )}
        {description && (
          <P theme="secondary" data-description="true">
            {description}
          </P>
        )}
        {platforms && (
          <div className="inline-flex mt-3 flex-wrap gap-y-1.5">
            {platforms
              .sort((a, b) => a.localeCompare(b))
              .map(platform => {
                if (platform.includes('*')) {
                  return (
                    <Tooltip.Root>
                      <Tooltip.Trigger key={platform} className="cursor-default">
                        <Tag name={platform} className="!rounded-full" />
                      </Tooltip.Trigger>
                      <Tooltip.Content side="bottom">
                        {platform.startsWith('android') && (
                          <FOOTNOTE>Android Emulator not supported</FOOTNOTE>
                        )}
                        {platform.startsWith('ios') && (
                          <FOOTNOTE>iOS Simulator not supported</FOOTNOTE>
                        )}
                      </Tooltip.Content>
                    </Tooltip.Root>
                  );
                }
                return <Tag name={platform} key={platform} className="!rounded-full" />;
              })}
          </div>
        )}
        {title && <Separator />}
        {children}
        <Footer
          title={title}
          sourceCodeUrl={sourceCodeUrl}
          packageName={packageName}
          previousPage={previousPage}
          nextPage={nextPage}
        />
      </div>
    </DocumentationNestedScrollLayout>
  );
}
