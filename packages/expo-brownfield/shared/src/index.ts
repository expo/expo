/**
 * Key under which the plugin writes the JSON-stringified list of host-provided
 * frameworks into `ios/Podfile.properties.json`, and from which the CLI reads
 * it back. Both sides import this constant so the contract cannot drift.
 */
export const HOST_PROVIDED_FRAMEWORKS_KEY = 'ios.brownfieldHostProvidedFrameworks';
