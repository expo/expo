"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEntitlements = createEntitlements;
exports.createEntitlementsFile = createEntitlementsFile;
const plist_1 = __importDefault(require("@expo/plist"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SECURITY_GROUPS_KEY = 'com.apple.security.application-groups';
function createEntitlements(appGroupId) {
    const buildObject = {};
    buildObject[SECURITY_GROUPS_KEY] = [appGroupId];
    return buildObject;
}
function createEntitlementsFile(targetDirectory, extensionTargetName, appGroupId) {
    const entitlementsPath = path_1.default.join(targetDirectory, `/${extensionTargetName}.entitlements`);
    const entitlementsObject = createEntitlements(appGroupId);
    const builtPlist = plist_1.default.build(entitlementsObject);
    return fs_1.default.writeFileSync(entitlementsPath, builtPlist);
}
