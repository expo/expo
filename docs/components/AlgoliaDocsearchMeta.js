import React from 'react';

export default class AlgoliaDocsearchMeta extends React.PureComponent {
  defaultProps = {
    referenceVersion: 'latest',
    isReferencePage: false,
  };

  getVersion() {
    if (!this.props.isReferencePage) {
      return 'none';
    }

    return this.props.referenceVersion;
  }

  render() {
    return <meta name="docsearch:version" content={this.getVersion()} />;
  }
}
