import { useRouter } from 'next/router';
import React, { PropsWithChildren, useMemo } from 'react';

import { PageHeader } from './PageHeader';
import { getActiveSection, getRoutes } from './navigation';

import DocumentationFooter from '~/components/DocumentationFooter';
import DocumentationHeader from '~/components/DocumentationHeader';
import { usePageApiVersion } from '~/providers/page-api-version';
import { PageMetadata } from '~/types/common';
import { Layout } from '~/ui/components/Layout';
import { Navigation } from '~/ui/components/Navigation';
import { TableOfContents } from '~/ui/components/TableOfContents';

type PageProps = PropsWithChildren<{
  meta: PageMetadata;
}>;

export function PageScene(props: PageProps) {
  const router = useRouter();
  const { version } = usePageApiVersion();

  const activeSection = useMemo(() => getActiveSection(router.pathname), [router.pathname]);
  const routes = useMemo(() => getRoutes(router.pathname, version), [router.pathname, version]);

  const header = (
    <DocumentationHeader
      activeSection={activeSection}
      isMenuActive={false}
      isMobileSearchActive={false}
      isAlgoliaSearchHidden={false}
      onShowMenu={() => {}}
      onHideMenu={() => {}}
      onToggleSearch={() => {}}
    />
  );

  const navigation = <Navigation routes={routes} />;
  const sidebar = !props.meta.hideTOC && <TableOfContents />;

  return (
    <Layout header={header} navigation={navigation} sidebar={sidebar}>
      <PageHeader {...props.meta} />
      {props.children}
      <DocumentationFooter
        router={router}
        title={props.meta.title}
        sourceCodeUrl={props.meta.sourceCodeUrl}
      />
    </Layout>
  );
}
