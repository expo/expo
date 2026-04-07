"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateHasteCandidatesError = void 0;
const constants_1 = __importDefault(require("../../constants"));
class DuplicateHasteCandidatesError extends Error {
    hasteName;
    platform;
    supportsNativePlatform;
    duplicatesSet;
    constructor(name, platform, supportsNativePlatform, duplicatesSet) {
        const platformMessage = getPlatformMessage(platform);
        super(`The name \`${name}\` was looked up in the Haste module map. It ` +
            'cannot be resolved, because there exists several different ' +
            'files, or packages, that provide a module for ' +
            `that particular name and platform. ${platformMessage} You must ` +
            'delete or exclude files until there remains only one of these:\n\n' +
            Array.from(duplicatesSet)
                .map(([dupFilePath, dupFileType]) => `  * \`${dupFilePath}\` (${getTypeMessage(dupFileType)})\n`)
                .sort()
                .join(''));
        this.hasteName = name;
        this.platform = platform;
        this.supportsNativePlatform = supportsNativePlatform;
        this.duplicatesSet = duplicatesSet;
    }
}
exports.DuplicateHasteCandidatesError = DuplicateHasteCandidatesError;
function getPlatformMessage(platform) {
    if (platform === constants_1.default.GENERIC_PLATFORM) {
        return 'The platform is generic (no extension).';
    }
    return `The platform extension is \`${platform}\`.`;
}
function getTypeMessage(type) {
    switch (type) {
        case constants_1.default.MODULE:
            return 'module';
        case constants_1.default.PACKAGE:
            return 'package';
    }
    return 'unknown';
}
