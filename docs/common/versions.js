import navigation from '~/navigation-data.json';
import _ from 'lodash';

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
    : process.env.LATEST_VERSION;

export { VERSIONS, LATEST_VERSION };
