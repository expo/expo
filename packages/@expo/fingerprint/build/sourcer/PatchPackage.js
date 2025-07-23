"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatchPackageSourcesAsync = getPatchPackageSourcesAsync;
const chalk_1 = __importDefault(require("chalk"));
const Utils_1 = require("./Utils");
const Path_1 = require("../utils/Path");
const debug = require('debug')('expo:fingerprint:sourcer:PatchPackage');
async function getPatchPackageSourcesAsync(projectRoot, options) {
    if ((0, Path_1.isIgnoredPathWithMatchObjects)('patches', options.ignoreDirMatchObjects)) {
        debug(`Skipping dir - ${chalk_1.default.dim('patches')} (ignored by ignoreDirMatchObjects)`);
        return [];
    }
    const result = await (0, Utils_1.getFileBasedHashSourceAsync)(projectRoot, 'patches', 'patchPackage');
    if (result != null) {
        debug(`Adding dir - ${chalk_1.default.dim('patches')}`);
        return [result];
    }
    return [];
}
//# sourceMappingURL=PatchPackage.js.map