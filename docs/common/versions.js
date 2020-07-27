import Package from '~/package.json';

const VERSIONS = preval`
  const { readdirSync } = require('fs');
  const semver = require('semver');
  const { version } = require('../package.json');

  const versionsContents = readdirSync('./pages/versions', {withFileTypes: true});
  const versionDirectories = versionsContents.filter(f => f.isDirectory()).map(f => f.name);
  const versions = versionDirectories.filter(
    dir => {
      if (process.env.NODE_ENV != 'production') {
        // show all versions in dev mode
        return true;
      } else if (dir == 'unversioned') {
        // hide unversioned in production
        return false;
      } else {
        // show all other versions in production except
        // those greater than the package.json version number
        const dirVersion = semver.clean(dir);
        if (dirVersion) {
          return semver.lte(dirVersion, version);
        }
      }
      return true;
    }
  );

  module.exports = versions;
`;

const LATEST_VERSION = `v${Package.version}`;

export { VERSIONS, LATEST_VERSION };
