"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExportPathForDependencyWithOptions = void 0;
/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const path_1 = __importDefault(require("path"));
const getCssDeps_1 = require("./getCssDeps");
function getExportPathForDependencyWithOptions(dependencyPath, { platform, serverRoot }) {
    const bundlePath = path_1.default.relative(serverRoot, dependencyPath);
    const relativePathname = path_1.default.join(path_1.default.dirname(bundlePath), 
    // Strip the file extension
    path_1.default.basename(bundlePath, path_1.default.extname(bundlePath)));
    const name = (0, getCssDeps_1.fileNameFromContents)({
        filepath: relativePathname,
        // TODO: Add content hash
        src: relativePathname,
    });
    return (`_expo/static/js/${platform}/` +
        // make filename safe
        // dependency.data.data.key.replace(/[^a-z0-9]/gi, '_') +
        name +
        '.js');
}
exports.getExportPathForDependencyWithOptions = getExportPathForDependencyWithOptions;
