import React, { Fragment } from 'react';

export default class AlgoliaDocsearchTags extends React.PureComponent {
  defaultProps = {
    referenceVersion: 'latest',
    isReferencePage: false,
  };

  render() {
    const { referenceVersion, isReferencePage } = this.props;

    return (
      <Fragment>
        {isReferencePage && <meta name="docsearch:version" content={referenceVersion} />}
        {isReferencePage
          ? <meta name="docsearch:type" content="reference" />
          : <meta name="docsearch:type" content="page" />
        }
      </Fragment>
    );
  }
}
