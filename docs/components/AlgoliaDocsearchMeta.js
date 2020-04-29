import React from 'react';

import { LATEST_VERSION } from '~/common/versions';

export default class AlgoliaDocsearchMeta extends React.PureComponent {
  defaultProps = {
    referenceVersion: 'latest',
    isReferencePage: false,
  };

  getVersion() {
    if (!this.props.isReferencePage) {
      return 'none';
    }

    return this.props.referenceVersion === 'latest' ? LATEST_VERSION : this.props.referenceVersion;
  }

  render() {
    return <meta name="docsearch:version" content={this.getVersion()} />;
  }
}
