// @preval

const { readdirSync } = require('fs');
const semver = require('semver');

const { version } = require('../package.json');

const versionContents = readdirSync('./pages/versions', { withFileTypes: true });
const versionDirectories = versionContents.filter(f => f.isDirectory()).map(f => f.name);

/**
 * The current latest version of the docs.
 * This is the `package.json` version.
 */
const LATEST_VERSION = `v${version}`;

/**
 * The list of all versions supported by the docs.
 * It's caluclated from the `pages/versions` folder names, and uses the following sorting:
 *   - `unversioned`
 *   - `latest`
 *   - versions from new to old (e.g. 39, 38, 37)
 */
const VERSIONS = versionDirectories
  .filter(dir => {
    // show all versions in dev mode
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    // hide unversioned in production
    if (dir === 'unversioned') {
      return false;
    }
    // show all other versions in production except
    // those greater than the package.json version number
    const dirVersion = semver.clean(dir);
    if (dirVersion) {
      return semver.lte(dirVersion, version);
    }
    return true;
  })
  .sort((a, b) => {
    if (a === 'unversioned' || a === 'latest') return -1;
    if (b === 'unversioned' || b === 'latest') return 1;

    return semver.major(b) - semver.major(a);
  });

module.exports = {
  VERSIONS,
  LATEST_VERSION,
};
