import Package from '~/package.json';

const versionDirectories = preval`
  const { readdirSync } = require('fs');

  const versionsContents = readdirSync('./versions', {withFileTypes: true});

  module.exports = versionsContents.filter(f => f.isDirectory()).map(f => f.name);
`;

const VERSIONS = versionDirectories
  .concat(['latest'])
  .filter(dir => process.env.NODE_ENV != 'production' || dir != 'unversioned');

const LATEST_VERSION =
  typeof window !== 'undefined' && window._LATEST_VERSION
    ? window._LATEST_VERSION
    : `v${Package.version}`;

export { VERSIONS, LATEST_VERSION };
