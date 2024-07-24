import fsExtra from 'fs-extra';
import semver from 'semver';

const { readdirSync, readJsonSync } = fsExtra;
const { version, betaVersion } = readJsonSync('./package.json');

const versionContents = readdirSync('./pages/versions', { withFileTypes: true });
const versionDirectories = versionContents.filter(f => f.isDirectory()).map(f => f.name);

/**
 * The current latest version of the docs.
 * This is the `package.json` version.
 */
export const LATEST_VERSION = `v${version}`;

/**
 * The currently active beta version.
 * This is the `package.json` betaVersion field.
 * This will usually be undefined, except for during beta testing periods prior to a new release.
 */
export const BETA_VERSION = betaVersion ? `v${betaVersion}` : false;

/**
 * The list of all versions supported by the docs.
 * It's calculated from the `pages/versions` folder names, and uses the following sorting:
 *   - `unversioned`
 *   - `latest`
 *   - versions from new to old (e.g. v39.0.0, v38.0.0, v37.0.0)
 */
export const VERSIONS = versionDirectories
  .filter(dir => {
    // show all other versions in production except
    // those greater than the package.json version number
    const dirVersion = semver.clean(dir);
    if (dirVersion) {
      return semver.lte(dirVersion, version) || dirVersion === betaVersion;
    }
    return true;
  })
  .sort((a, b) => {
    if (a === 'unversioned') return -1;
    if (b === 'unversioned') return 1;
    if (a === BETA_VERSION) return -1;
    if (b === BETA_VERSION) return 1;
    if (a === 'latest') return -1;
    if (b === 'latest') return 1;
    return semver.major(b) - semver.major(a);
  });
