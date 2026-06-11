"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOST_PROVIDED_FRAMEWORKS_KEY = void 0;
/**
 * Key under which the plugin writes the JSON-stringified list of host-provided
 * frameworks into `ios/Podfile.properties.json`, and from which the CLI reads
 * it back. Both sides import this constant so the contract cannot drift.
 */
exports.HOST_PROVIDED_FRAMEWORKS_KEY = 'ios.brownfieldHostProvidedFrameworks';
//# sourceMappingURL=index.js.map