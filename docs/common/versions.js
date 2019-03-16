import Package from '../package.json';

const VERSIONS = preval`
  const { readdirSync } = require('fs');

  const versionsContents = readdirSync('./pages/versions', {withFileTypes: true});
  const versionDirectories = versionsContents.filter(f => f.isDirectory()).map(f => f.name);
  const versions = versionDirectories.filter(
    dir => process.env.NODE_ENV != 'production' || dir != 'unversioned'
  );

  module.exports = versions;
`;

const LATEST_VERSION = `v${Package.version}`;

export { VERSIONS, LATEST_VERSION };
