import { useLoaderData } from 'expo-router';
import type { ComponentType } from 'react';

import { ApiDataProvider, type ApiSectionData } from '~/providers/api-data';
import type { PageMetadata, RemarkHeading } from '~/types/common';

import { useRouter, useRouterReady } from './next-compat/router';

type MdxPageModule = {
  default: ComponentType<{ meta: PageMetadata; headings: RemarkHeading[] }>;
  meta?: PageMetadata;
  headings?: RemarkHeading[];
};

/**
 * Makes a route component from a compiled MDX page. Next.js gives `meta` and `headings` to
 * the page through `getStaticProps`.
 */
export function createMdxRoute(page: MdxPageModule) {
  const Page = page.default;
  const meta = page.meta ?? ({} as PageMetadata);
  const headings = page.headings ?? [];

  return function MdxRoute() {
    // A page registers its headings while it renders, into an object that the page wrapper
    // makes on each render. That is correct only if a router change renders the page from
    // the top, as the Next.js `App` component does. Reading the router here gives that.
    useRouter();
    useRouterReady();
    return <Page meta={meta} headings={headings} />;
  };
}

/**
 * Makes a route component for a page that has an `<APISection>`. The route `loader` reads
 * the API data. Next.js gives it to `ApiDataProvider` through `getStaticProps` and
 * `pages/_app.tsx`.
 */
export function createMdxRouteWithApiData(page: MdxPageModule) {
  const MdxRoute = createMdxRoute(page);

  return function MdxRouteWithApiData() {
    const apiSectionData = useLoaderData() as ApiSectionData;
    return (
      <ApiDataProvider data={apiSectionData}>
        <MdxRoute />
      </ApiDataProvider>
    );
  };
}

/** Makes a route component from a page that is not an MDX file. */
export function createPageRoute(Page: ComponentType) {
  return function PageRoute() {
    useRouterReady();
    return <Page />;
  };
}

/**
 * Makes a route component from a page that does not render `DocumentationHead` in the
 * static render. It adds the two head tags that Next.js adds to a page that sets no
 * `charset` or `viewport`.
 */
export function createPageRouteWithDefaultHead(Page: ComponentType) {
  const PageRoute = createPageRoute(Page);

  return function PageRouteWithDefaultHead() {
    return (
      <>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <PageRoute />
      </>
    );
  };
}
