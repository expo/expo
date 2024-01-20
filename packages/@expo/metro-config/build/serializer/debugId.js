"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToUUID = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
/**
 * Copyright © 2023 650 Industries.
 * Copyright (c) 2022, Sentry.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * Deterministically hashes a string and turns the hash into a uuid.
 * https://github.com/getsentry/sentry-javascript-bundler-plugins/blob/58271f1af2ade6b3e64d393d70376ae53bc5bd2f/packages/bundler-plugin-core/src/utils.ts#L174
 */
function stringToUUID(str) {
    const md5sum = node_crypto_1.default.createHash('md5');
    md5sum.update(str);
    const md5Hash = md5sum.digest('hex');
    // Position 16 is fixed to either 8, 9, a, or b in the uuid v4 spec (10xx in binary)
    // RFC 4122 section 4.4
    const v4variant = ['8', '9', 'a', 'b'][md5Hash.substring(16, 17).charCodeAt(0) % 4];
    return (md5Hash.substring(0, 8) +
        '-' +
        md5Hash.substring(8, 12) +
        '-4' +
        md5Hash.substring(13, 16) +
        '-' +
        v4variant +
        md5Hash.substring(17, 20) +
        '-' +
        md5Hash.substring(20)).toLowerCase();
}
exports.stringToUUID = stringToUUID;
//# sourceMappingURL=debugId.js.map