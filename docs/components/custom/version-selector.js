import { orderBy } from 'lodash';

import * as React from 'react';
import * as Constants from '~/common/constants';

import { VERSIONS, LATEST_VERSION } from '~/common/versions';

class VersionSelector extends React.Component {
  render() {
    return (
      <div>
        <div
          style={{
            paddingTop: '8px',
            paddingRight: '10px',
            display: 'inline-block',
          }}>
          <select
            value={this.props.activeVersion}
            onChange={e => this.props.setVersion(e.target.value)}
            style={{
              marginLeft: '4px',
              cursor: `pointer`,
              fontSize: '100%',
              background: 'transparent',
              fontFamily: Constants.fontFamilies.book,
            }}>
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
          <style jsx>
            {`
              // Desktop
              @media screen and (min-width: ${Constants.breakpoints.mobile}) {
                border: none;
                border-radius: 0;
                outline: none;
              }

              // Mobile
              @media screen and (max-width: ${Constants.breakpoints.mobile}) {
                select {
                  border-radius: 2px;
                  border: 1px solid rgb(166, 166, 166);
                  padding: 5px;
                }
              }
            `}
          </style>
        </div>
      </div>
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
