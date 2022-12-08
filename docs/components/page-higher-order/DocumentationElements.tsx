import GithubSlugger from 'github-slugger';
import { useRouter } from 'next/router';
import React, { PropsWithChildren } from 'react';

import { HeadingManager } from '~/common/headingManager';
import DocumentationPage from '~/components/DocumentationPage';
import { HeadingsContext } from '~/components/page-higher-order/withHeadingManager';
import { PageApiVersionProvider } from '~/providers/page-api-version';
import { PageMetadataContext } from '~/providers/page-metadata';
import { PageMetadata, RemarkHeading } from '~/types/common';
import { AnchorContext } from '~/ui/components/Text';

type DocumentationElementsProps = PropsWithChildren<{
  meta: PageMetadata;
  headings: RemarkHeading[];
}>;

export default function DocumentationElements(props: DocumentationElementsProps) {
  const router = useRouter();
  const slugger = new GithubSlugger();
  const manager = new HeadingManager(slugger, {
    ...props.meta,
    headings: props.headings,
  });

  return (
    <AnchorContext.Provider value={slugger}>
      <HeadingsContext.Provider value={manager}>
        <PageMetadataContext.Provider value={props.meta}>
          <PageApiVersionProvider router={router}>
            <DocumentationPage
              router={router}
              title={props.meta.title || ''}
              description={props.meta.description || ''}
              sourceCodeUrl={props.meta.sourceCodeUrl}
              tocVisible={!props.meta.hideTOC}
              hideFromSearch={props.meta.hideFromSearch}
              packageName={props.meta.packageName}>
              {props.children}
            </DocumentationPage>
          </PageApiVersionProvider>
        </PageMetadataContext.Provider>
      </HeadingsContext.Provider>
    </AnchorContext.Provider>
  );
}
