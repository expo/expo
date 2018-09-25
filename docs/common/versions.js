import navigation from '~/generated/navigation-data.json';
import _ from 'lodash';
import Package from '~/package.json';

let VERSIONS = _.map(navigation, 'version');
VERSIONS = _.map(VERSIONS, v => {
  if (v !== 'unversioned') {
    return v + '.0.0';
  } else {
    return v;
  }
});
VERSIONS.push(`latest`);

const LATEST_VERSION =
  typeof window !== 'undefined' && window._LATEST_VERSION
    ? window._LATEST_VERSION
    : `v${Package.version}`;

export { VERSIONS, LATEST_VERSION };
