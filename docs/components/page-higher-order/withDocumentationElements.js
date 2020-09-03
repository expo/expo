import * as React from 'react';
import GithubSlugger from 'github-slugger';
import { withRouter } from 'next/router';
import { MDXProvider } from '@mdx-js/react';

import { HeadingManager } from '~/common/headingManager';
import * as components from '~/common/translate-markdown';
import DocumentationPage from '~/components/DocumentationPage';
import { HeadingsContext } from '~/components/page-higher-order/withHeadingManager';

const withDocumentationElements = (meta) => {
  const DocumentationElementsHOC = withRouter((props) => {
    const { router } = props;

    return (
        <HeadingsContext.Provider value={new HeadingManager(new GithubSlugger(), meta.headings)}>
            <DocumentationPage
              title={meta.title}
              url={router}
              asPath={router.asPath}
              sourceCodeUrl={meta.sourceCodeUrl}>
              <MDXProvider components={components}>{this.props.children}</MDXProvider>
            </DocumentationPage>
          </HeadingsContext.Provider>
    )
  })

  return DocumentationElementsHOC;
};

export default withDocumentationElements;
