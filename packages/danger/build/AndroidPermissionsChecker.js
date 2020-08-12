"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndroidPermissions = void 0;
const lodash_1 = require("lodash");
const TOUCHED_PERMISSION_REGEX = new RegExp(/\+\s+<uses-permission*.+android:name="([a-zA-Z._-]+)"/, 'i');
/**
 * This function checks if the Android Permissions was modified, using the following steps:
 * - Check if there was a change made in the `AndroidManifest.xml`.
 * - Check if a new `use-permissions` tag was added.
 * - Warn about also adding new permissions to the XDL blacklist.
 * - _Never_ fail CI, but add a warning to the PR as a reminder.
 */
async function checkAndroidPermissions() {
    const manifests = getTouchedManifests();
    if (manifests.length === 0) {
        console.log('Everything is ok 🎉');
        return;
    }
    const results = await Promise.all(manifests.map(async (manifest) => ({
        manifest,
        permissions: await getAddedManifestPermissions(manifest),
    })));
    outputResult(results.filter(result => result.permissions.length > 0));
}
exports.checkAndroidPermissions = checkAndroidPermissions;
/**
 * Get a list of modified or created Android manifests, from danger's git.
 * This only returns `AndroidManifest.xml` files within the `packages/` folder.
 */
function getTouchedManifests() {
    const touchedFiles = [...danger.git.modified_files, ...danger.git.created_files];
    return lodash_1.uniq(touchedFiles.filter(file => file.startsWith('packages') && file.endsWith('AndroidManifest.xml')));
}
/**
 * Determine if the Android manifest file has an added `use-permission` tag.
 */
async function getAddedManifestPermissions(filePath) {
    const result = await danger.git.diffForFile(filePath);
    if (!result) {
        return [];
    }
    return result.diff
        .split('\n')
        .map(line => { var _a, _b; return ((_b = (_a = line.match(TOUCHED_PERMISSION_REGEX)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) || ''; })
        .filter(Boolean);
}
/**
 * Generate a report and output a message warning for the added permissions in the Android manifest.
 */
function outputResult(results) {
    if (results.length === 0) {
        return;
    }
    const manifestLinks = results.map(result => `- <code>${danger.github.utils.fileLinks([result.manifest], false)}</code>`);
    warn(`**Android manifests with new permissions**
------
${manifestLinks.join('\n')}
`);
    markdown(`### ⚠️  Android permissions added
Please make sure these permissions are absolutely required for the core functionality of the modules. All permissions added in the Android Manifests are included, by default, in the standalone builds.

<details>
  <summary>What can I do?</summary>

  - Reconsider if the permission is required, and remove it from the \`AndroidManifest.xml\`.
  - Add the permission to the [XDL blacklist](https://github.com/expo/expo-cli/blob/d75089b2e9f11b36f936967313d847fcc45f4e76/packages/xdl/src/detach/AndroidShellApp.js#L780) to allow users to opt-out of the permissions, by excluding it from the \`android.permissions\` manifest property.

</details>
`.trim());
}
//# sourceMappingURL=AndroidPermissionsChecker.js.map