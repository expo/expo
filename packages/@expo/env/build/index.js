"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEnabled = exports.load = exports.get = exports.getFiles = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const env_1 = require("./env");
Object.defineProperty(exports, "getFiles", { enumerable: true, get: function () { return env_1.getFiles; } });
Object.defineProperty(exports, "isEnabled", { enumerable: true, get: function () { return env_1.isEnabled; } });
const { get, load } = (0, env_1.createControlledEnvironment)();
exports.get = get;
exports.load = load;
