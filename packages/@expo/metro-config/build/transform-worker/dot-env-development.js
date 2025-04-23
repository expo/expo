"use strict";
/**
 * Copyright 2025-present 650 Industries (Expo). All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseEnvFile = parseEnvFile;
const dotenv = __importStar(require("dotenv"));
const dotenv_expand_1 = require("dotenv-expand");
function parseEnvFile(src, isClient) {
    const expandedEnv = {};
    const envFileParsed = dotenv.parse(src);
    if (envFileParsed) {
        const allExpandedEnv = (0, dotenv_expand_1.expand)({
            parsed: envFileParsed,
            processEnv: {},
        });
        for (const key of Object.keys(envFileParsed)) {
            if (allExpandedEnv.parsed?.[key]) {
                if (isClient && !key.startsWith('EXPO_PUBLIC_')) {
                    // Don't include non-public variables in the client bundle.
                    continue;
                }
                expandedEnv[key] = allExpandedEnv.parsed[key];
            }
        }
    }
    return expandedEnv;
}
//# sourceMappingURL=dot-env-development.js.map