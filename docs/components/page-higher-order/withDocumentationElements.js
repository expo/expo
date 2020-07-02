import * as React from 'react';
import GithubSlugger from 'github-slugger';
import { withRouter } from 'next/router';
import { MDXProvider } from '@mdx-js/tag';

import DocumentationPage from '~/components/DocumentationPage';
import { SluggerContext } from '~/components/page-higher-order/withSlugger';
import * as components from '~/common/translate-markdown';

export default meta =>
  withRouter(
    class DocumentationPageHOC extends React.Component {
      render() {
        const { router } = this.props;
        return (
          <DocumentationPage
            title={meta.title}
            url={router}
            asPath={router.asPath}
            sourceCodeUrl={meta.sourceCodeUrl}>
            <SluggerContext.Provider value={new GithubSlugger()}>
              <MDXProvider components={components}>{this.props.children}</MDXProvider>
            </SluggerContext.Provider>
          </DocumentationPage>
        );
      }
    }
  );
