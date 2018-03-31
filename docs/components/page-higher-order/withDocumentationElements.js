import * as React from 'react';

import DocumentationPage from '~/components/DocumentationPage';

export default options => {
  return content => {
    class DocumentationPageHOC extends React.Component {
      static async getInitialProps(context) {
        return { asPath: context.asPath };
      }

      render() {
        return (
          <DocumentationPage title={options.title} url={this.props.url} asPath={this.props.asPath}>
            {content}
          </DocumentationPage>
        );
      }
    }

    return DocumentationPageHOC;
  };
};

