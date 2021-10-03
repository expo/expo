import { useRouter } from 'next/router';
import * as React from 'react';

import DocumentationPage from '~/components/DocumentationPage';
import { PageMetadata } from '~/types/common';

type DocumentationElementsProps = React.PropsWithChildren<{
  meta: PageMetadata;
  headings: any[];
}>;

function DocumentationElements(props: DocumentationElementsProps) {
  const router = useRouter();

  return (
    <DocumentationPage
      title={props.meta.title}
      url={router}
      asPath={router.asPath}
      sourceCodeUrl={props.meta.sourceCodeUrl}
      tocVisible={!props.meta.hideTOC}
      hideFromSearch={props.meta.hideFromSearch}
      headings={props.headings}>
      {props.children}
    </DocumentationPage>
  );
}

export default DocumentationElements;
