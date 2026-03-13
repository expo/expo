"use strict";
/**
 * Copyright 2025-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEnvFile = parseEnvFile;
const env_1 = require("@expo/env");
function parseEnvFile(src, isClient) {
    const output = {};
    const env = (0, env_1.parseEnv)(src);
    for (const key of Object.keys(env)) {
        if (env[key] != null) {
            if (isClient && !key.startsWith('EXPO_PUBLIC_')) {
                // Don't include non-public variables in the client bundle.
                continue;
            }
            output[key] = env[key];
        }
    }
    return output;
}
//# sourceMappingURL=dot-env-development.js.map