"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatchPackageSourcesAsync = getPatchPackageSourcesAsync;
const chalk_1 = __importDefault(require("chalk"));
const Utils_1 = require("./Utils");
const debug = require('debug')('expo:fingerprint:sourcer:PatchPackage');
async function getPatchPackageSourcesAsync(projectRoot, options) {
    const result = await (0, Utils_1.getFileBasedHashSourceAsync)(projectRoot, 'patches', 'patchPackage');
    if (result != null) {
        debug(`Adding dir - ${chalk_1.default.dim('patches')}`);
        return [result];
    }
    return [];
}
//# sourceMappingURL=PatchPackage.js.map