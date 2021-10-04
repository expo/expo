import GithubSlugger from 'github-slugger';
import { useRouter } from 'next/router';
import React, { PropsWithChildren } from 'react';

import { HeadingManager } from '~/common/headingManager';
import DocumentationPage from '~/components/DocumentationPage';
import { HeadingsContext } from '~/components/page-higher-order/withHeadingManager';
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
      <DocumentationPage
        title={props.meta.title || ''}
        url={router}
        asPath={router.asPath}
        sourceCodeUrl={props.meta.sourceCodeUrl}
        tocVisible={!props.meta.hideTOC}
        hideFromSearch={props.meta.hideFromSearch}>
        {props.children}
      </DocumentationPage>
    </HeadingsContext.Provider>
  );
}
