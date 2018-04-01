import { orderBy } from 'lodash';

import * as React from 'react';
import * as Constants from '~/common/constants';

import { VERSIONS, LATEST_VERSION } from '~/common/versions';

class VersionSelector extends React.Component {
  render() {
    return (
      <select
        value={this.props.activeVersion}
        onChange={e => this.props.setVersion(e.target.value)}>
        {orderVersions(VERSIONS)
          .map(version => {
            return (
              <option key={version} value={version}>
                {version === 'latest' ? 'latest (' + LATEST_VERSION + ')' : version}
              </option>
            );
          })
          .reverse()}
      </select>
    );
  }
}

function orderVersions(versions) {
  versions = [...versions];

  if (versions.indexOf('unversioned') >= 0) {
    versions.splice(versions.indexOf('unversioned'), 1);
  }

  if (versions.indexOf('latest') >= 0) {
    versions.splice(versions.indexOf('latest'), 1);
  }

  versions = orderBy(
    versions,
    v => {
      let match = v.match(/v([0-9]+)\./);
      return parseInt(match[1], 10);
    },
    ['asc']
  );

  versions.push('latest');

  if (
    (typeof window === 'object' && window._NODE_ENV === 'development') ||
    (process.env.NODE_ENV && process.env.NODE_ENV === 'development')
  ) {
    versions.push('unversioned');
  }

  return versions;
}

export default VersionSelector;
