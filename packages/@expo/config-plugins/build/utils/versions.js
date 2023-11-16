"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lteSdkVersion = exports.gteSdkVersion = void 0;
const semver_1 = __importDefault(require("semver"));
function gteSdkVersion(exp, sdkVersion) {
    if (!exp.sdkVersion) {
        return false;
    }
    if (exp.sdkVersion === 'UNVERSIONED') {
        return true;
    }
    try {
        return semver_1.default.gte(exp.sdkVersion, sdkVersion);
    }
    catch {
        throw new Error(`${exp.sdkVersion} is not a valid version. Must be in the form of x.y.z`);
    }
}
exports.gteSdkVersion = gteSdkVersion;
function lteSdkVersion(exp, sdkVersion) {
    if (!exp.sdkVersion) {
        return false;
    }
    if (exp.sdkVersion === 'UNVERSIONED') {
        return false;
    }
    try {
        return semver_1.default.lte(exp.sdkVersion, sdkVersion);
    }
    catch {
        throw new Error(`${exp.sdkVersion} is not a valid version. Must be in the form of x.y.z`);
    }
}
exports.lteSdkVersion = lteSdkVersion;
