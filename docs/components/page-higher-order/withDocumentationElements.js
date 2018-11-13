import * as React from 'react';
import GithubSlugger from 'github-slugger';

import DocumentationPage from '~/components/DocumentationPage';
import { SluggerContext } from '~/components/page-higher-order/withSlugger';

export default options => {
  return content => {
    class DocumentationPageHOC extends React.Component {
      static async getInitialProps(context) {
        return { asPath: context.asPath };
      }

      render() {
        return (
          <DocumentationPage title={options.title} url={this.props.url} asPath={this.props.asPath}>
            <SluggerContext.Provider value={new GithubSlugger()}>
              {content}
            </SluggerContext.Provider>
          </DocumentationPage>
        );
      }
    }

    return DocumentationPageHOC;
  };
};

