/**
 * This function checks if the Android Permissions was modified, using the following steps:
 * - Check if there was a change made in the `AndroidManifest.xml`.
 * - Check if a new `use-permissions` tag was added.
 * - Warn about also adding new permissions to the XDL blacklist.
 * - _Never_ fail CI, but add a warning to the PR as a reminder.
 */
export declare function checkAndroidPermissions(): Promise<void>;
