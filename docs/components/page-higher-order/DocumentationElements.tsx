import GithubSlugger from 'github-slugger';
import { useRouter } from 'next/router';
import React, { PropsWithChildren } from 'react';

import { HeadingManager } from '~/common/headingManager';
import DocumentationPage from '~/components/DocumentationPage';
import { HeadingsContext } from '~/components/page-higher-order/withHeadingManager';
import { PageApiVersionProvider } from '~/providers/page-api-version';
import { PageMetadataContext } from '~/providers/page-metadata';
import { PageMetadata, RemarkHeading } from '~/types/common';

type DocumentationElementsProps = PropsWithChildren<{
  meta: PageMetadata;
  headings: RemarkHeading[];
}>;

export default function DocumentationElements(props: DocumentationElementsProps) {
  const router = useRouter();
  const manager = new HeadingManager(new GithubSlugger(), {
    ...props.meta,
    headings: props.headings,
  });

  return (
    <HeadingsContext.Provider value={manager}>
      <PageMetadataContext.Provider value={props.meta}>
        <PageApiVersionProvider router={router}>
          <DocumentationPage
            router={router}
            title={props.meta.title || ''}
            sourceCodeUrl={props.meta.sourceCodeUrl}
            tocVisible={!props.meta.hideTOC}
            hideFromSearch={props.meta.hideFromSearch}>
            {props.children}
          </DocumentationPage>
        </PageApiVersionProvider>
      </PageMetadataContext.Provider>
    </HeadingsContext.Provider>
  );
}
