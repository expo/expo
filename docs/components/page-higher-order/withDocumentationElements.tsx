import { MDXProvider } from '@mdx-js/react';
import GithubSlugger from 'github-slugger';
import { useRouter } from 'next/router';
import React, { PropsWithChildren } from 'react';

import { HeadingManager } from '~/common/headingManager';
import * as components from '~/common/translate-markdown';
import DocumentationPage from '~/components/DocumentationPage';
import { HeadingsContext } from '~/components/page-higher-order/withHeadingManager';
import { PageMetadata, RemarkHeading } from '~/types/common';

type DocumentationElementsProps = PropsWithChildren<{
  meta: PageMetadata;
  headings: RemarkHeading[];
}>;

function DocumentationElements(props: DocumentationElementsProps) {
  const router = useRouter();
  const manager = new HeadingManager(new GithubSlugger(), {
    ...props.meta,
    headings: props.headings,
  });

  return (
    <HeadingsContext.Provider value={manager}>
      <DocumentationPage
        title={props.meta.title}
        url={router}
        asPath={router.asPath}
        sourceCodeUrl={props.meta.sourceCodeUrl}
        tocVisible={!props.meta.hideTOC}
        hideFromSearch={props.meta.hideFromSearch}>
        <MDXProvider components={components}>{props.children}</MDXProvider>
      </DocumentationPage>
    </HeadingsContext.Provider>
  );
}

const withDocumentationElements = () => DocumentationElements;

export default withDocumentationElements;
