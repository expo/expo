"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureApplicationTargetEntitlementsFileConfigured = exports.getEntitlementsPath = exports.setAssociatedDomains = exports.withAssociatedDomains = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const slash_1 = __importDefault(require("slash"));
const Target_1 = require("./Target");
const Xcodeproj_1 = require("./utils/Xcodeproj");
const string_1 = require("./utils/string");
const ios_plugins_1 = require("../plugins/ios-plugins");
exports.withAssociatedDomains = (0, ios_plugins_1.createEntitlementsPlugin)(setAssociatedDomains, 'withAssociatedDomains');
function setAssociatedDomains(config, { 'com.apple.developer.associated-domains': _, ...entitlementsPlist }) {
    if (config.ios?.associatedDomains) {
        return {
            ...entitlementsPlist,
            'com.apple.developer.associated-domains': config.ios.associatedDomains,
        };
    }
    return entitlementsPlist;
}
exports.setAssociatedDomains = setAssociatedDomains;
function getEntitlementsPath(projectRoot, { targetName, buildConfiguration = 'Release', } = {}) {
    const project = (0, Xcodeproj_1.getPbxproj)(projectRoot);
    const xcBuildConfiguration = (0, Target_1.getXCBuildConfigurationFromPbxproj)(project, {
        targetName,
        buildConfiguration,
    });
    if (!xcBuildConfiguration) {
        return null;
    }
    const entitlementsPath = getEntitlementsPathFromBuildConfiguration(projectRoot, xcBuildConfiguration);
    return entitlementsPath && fs_1.default.existsSync(entitlementsPath) ? entitlementsPath : null;
}
exports.getEntitlementsPath = getEntitlementsPath;
function getEntitlementsPathFromBuildConfiguration(projectRoot, xcBuildConfiguration) {
    const entitlementsPathRaw = xcBuildConfiguration?.buildSettings?.CODE_SIGN_ENTITLEMENTS;
    if (entitlementsPathRaw) {
        return path_1.default.normalize(path_1.default.join(projectRoot, 'ios', (0, string_1.trimQuotes)(entitlementsPathRaw)));
    }
    else {
        return null;
    }
}
function ensureApplicationTargetEntitlementsFileConfigured(projectRoot) {
    const project = (0, Xcodeproj_1.getPbxproj)(projectRoot);
    const projectName = (0, Xcodeproj_1.getProjectName)(projectRoot);
    const productName = (0, Xcodeproj_1.getProductName)(project);
    const [, applicationTarget] = (0, Target_1.findFirstNativeTarget)(project);
    const buildConfigurations = (0, Xcodeproj_1.getBuildConfigurationsForListId)(project, applicationTarget.buildConfigurationList);
    let hasChangesToWrite = false;
    for (const [, xcBuildConfiguration] of buildConfigurations) {
        const oldEntitlementPath = getEntitlementsPathFromBuildConfiguration(projectRoot, xcBuildConfiguration);
        if (oldEntitlementPath && fs_1.default.existsSync(oldEntitlementPath)) {
            return;
        }
        hasChangesToWrite = true;
        // Use posix formatted path, even on Windows
        const entitlementsRelativePath = (0, slash_1.default)(path_1.default.join(projectName, `${productName}.entitlements`));
        const entitlementsPath = path_1.default.normalize(path_1.default.join(projectRoot, 'ios', entitlementsRelativePath));
        fs_1.default.mkdirSync(path_1.default.dirname(entitlementsPath), { recursive: true });
        if (!fs_1.default.existsSync(entitlementsPath)) {
            fs_1.default.writeFileSync(entitlementsPath, ENTITLEMENTS_TEMPLATE);
        }
        xcBuildConfiguration.buildSettings.CODE_SIGN_ENTITLEMENTS = entitlementsRelativePath;
    }
    if (hasChangesToWrite) {
        fs_1.default.writeFileSync(project.filepath, project.writeSync());
    }
}
exports.ensureApplicationTargetEntitlementsFileConfigured = ensureApplicationTargetEntitlementsFileConfigured;
const ENTITLEMENTS_TEMPLATE = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
</dict>
</plist>
`;
