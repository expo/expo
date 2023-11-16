"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIosModFileProviders = exports.withIosBaseMods = void 0;
const json_file_1 = __importDefault(require("@expo/json-file"));
const plist_1 = __importDefault(require("@expo/plist"));
const assert_1 = __importDefault(require("assert"));
const fs_1 = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const xcode_1 = __importDefault(require("xcode"));
const createBaseMod_1 = require("./createBaseMod");
const ios_1 = require("../ios");
const Entitlements_1 = require("../ios/Entitlements");
const Xcodeproj_1 = require("../ios/utils/Xcodeproj");
const getInfoPlistPath_1 = require("../ios/utils/getInfoPlistPath");
const modules_1 = require("../utils/modules");
const sortObject_1 = require("../utils/sortObject");
const warnings_1 = require("../utils/warnings");
const { readFile, writeFile } = fs_1.promises;
function getEntitlementsPlistTemplate() {
    // TODO: Fetch the versioned template file if possible
    return {};
}
function getInfoPlistTemplate() {
    // TODO: Fetch the versioned template file if possible
    return {
        CFBundleDevelopmentRegion: '$(DEVELOPMENT_LANGUAGE)',
        CFBundleExecutable: '$(EXECUTABLE_NAME)',
        CFBundleIdentifier: '$(PRODUCT_BUNDLE_IDENTIFIER)',
        CFBundleName: '$(PRODUCT_NAME)',
        CFBundlePackageType: '$(PRODUCT_BUNDLE_PACKAGE_TYPE)',
        CFBundleInfoDictionaryVersion: '6.0',
        CFBundleSignature: '????',
        LSRequiresIPhoneOS: true,
        NSAppTransportSecurity: {
            NSAllowsArbitraryLoads: true,
            NSExceptionDomains: {
                localhost: {
                    NSExceptionAllowsInsecureHTTPLoads: true,
                },
            },
        },
        UILaunchStoryboardName: 'SplashScreen',
        UIRequiredDeviceCapabilities: ['armv7'],
        UIViewControllerBasedStatusBarAppearance: false,
        UIStatusBarStyle: 'UIStatusBarStyleDefault',
        CADisableMinimumFrameDurationOnPhone: true,
    };
}
const defaultProviders = {
    dangerous: (0, createBaseMod_1.provider)({
        getFilePath() {
            return '';
        },
        async read() {
            return {};
        },
        async write() { },
    }),
    // Append a rule to supply AppDelegate data to mods on `mods.ios.appDelegate`
    appDelegate: (0, createBaseMod_1.provider)({
        getFilePath({ modRequest: { projectRoot } }) {
            // TODO: Get application AppDelegate file from pbxproj.
            return ios_1.Paths.getAppDelegateFilePath(projectRoot);
        },
        async read(filePath) {
            return ios_1.Paths.getFileInfo(filePath);
        },
        async write(filePath, { modResults: { contents } }) {
            await writeFile(filePath, contents);
        },
    }),
    // Append a rule to supply Expo.plist data to mods on `mods.ios.expoPlist`
    expoPlist: (0, createBaseMod_1.provider)({
        isIntrospective: true,
        getFilePath({ modRequest: { platformProjectRoot, projectName } }) {
            const supportingDirectory = path_1.default.join(platformProjectRoot, projectName, 'Supporting');
            return path_1.default.resolve(supportingDirectory, 'Expo.plist');
        },
        async read(filePath, { modRequest: { introspect } }) {
            try {
                return plist_1.default.parse(await readFile(filePath, 'utf8'));
            }
            catch (error) {
                if (introspect) {
                    return {};
                }
                throw error;
            }
        },
        async write(filePath, { modResults, modRequest: { introspect } }) {
            if (introspect) {
                return;
            }
            await writeFile(filePath, plist_1.default.build((0, sortObject_1.sortObject)(modResults)));
        },
    }),
    // Append a rule to supply .xcodeproj data to mods on `mods.ios.xcodeproj`
    xcodeproj: (0, createBaseMod_1.provider)({
        getFilePath({ modRequest: { projectRoot } }) {
            return ios_1.Paths.getPBXProjectPath(projectRoot);
        },
        async read(filePath) {
            const project = xcode_1.default.project(filePath);
            project.parseSync();
            return project;
        },
        async write(filePath, { modResults }) {
            await writeFile(filePath, modResults.writeSync());
        },
    }),
    // Append a rule to supply Info.plist data to mods on `mods.ios.infoPlist`
    infoPlist: (0, createBaseMod_1.provider)({
        isIntrospective: true,
        async getFilePath(config) {
            let project = null;
            try {
                project = (0, Xcodeproj_1.getPbxproj)(config.modRequest.projectRoot);
            }
            catch {
                // noop
            }
            // Only check / warn if a project actually exists, this'll provide
            // more accurate warning messages for users in managed projects.
            if (project) {
                const infoPlistBuildProperty = (0, getInfoPlistPath_1.getInfoPlistPathFromPbxproj)(project);
                if (infoPlistBuildProperty) {
                    //: [root]/myapp/ios/MyApp/Info.plist
                    const infoPlistPath = path_1.default.join(
                    //: myapp/ios
                    config.modRequest.platformProjectRoot, 
                    //: MyApp/Info.plist
                    infoPlistBuildProperty);
                    if ((0, modules_1.fileExists)(infoPlistPath)) {
                        return infoPlistPath;
                    }
                    (0, warnings_1.addWarningIOS)('mods.ios.infoPlist', `Info.plist file linked to Xcode project does not exist: ${infoPlistPath}`);
                }
                else {
                    (0, warnings_1.addWarningIOS)('mods.ios.infoPlist', 'Failed to find Info.plist linked to Xcode project.');
                }
            }
            try {
                // Fallback on glob...
                return await ios_1.Paths.getInfoPlistPath(config.modRequest.projectRoot);
            }
            catch (error) {
                if (config.modRequest.introspect) {
                    // fallback to an empty string in introspection mode.
                    return '';
                }
                throw error;
            }
        },
        async read(filePath, config) {
            // Apply all of the Info.plist values to the expo.ios.infoPlist object
            // TODO: Remove this in favor of just overwriting the Info.plist with the Expo object. This will enable people to actually remove values.
            if (!config.ios)
                config.ios = {};
            if (!config.ios.infoPlist)
                config.ios.infoPlist = {};
            let modResults;
            try {
                const contents = await readFile(filePath, 'utf8');
                (0, assert_1.default)(contents, 'Info.plist is empty');
                modResults = plist_1.default.parse(contents);
            }
            catch (error) {
                // Throw errors in introspection mode.
                if (!config.modRequest.introspect) {
                    throw error;
                }
                // Fallback to using the infoPlist object from the Expo config.
                modResults = getInfoPlistTemplate();
            }
            config.ios.infoPlist = {
                ...(modResults || {}),
                ...config.ios.infoPlist,
            };
            return config.ios.infoPlist;
        },
        async write(filePath, config) {
            // Update the contents of the static infoPlist object
            if (!config.ios) {
                config.ios = {};
            }
            config.ios.infoPlist = config.modResults;
            // Return early without writing, in introspection mode.
            if (config.modRequest.introspect) {
                return;
            }
            await writeFile(filePath, plist_1.default.build((0, sortObject_1.sortObject)(config.modResults)));
        },
    }),
    // Append a rule to supply .entitlements data to mods on `mods.ios.entitlements`
    entitlements: (0, createBaseMod_1.provider)({
        isIntrospective: true,
        async getFilePath(config) {
            try {
                (0, Entitlements_1.ensureApplicationTargetEntitlementsFileConfigured)(config.modRequest.projectRoot);
                return ios_1.Entitlements.getEntitlementsPath(config.modRequest.projectRoot) ?? '';
            }
            catch (error) {
                if (config.modRequest.introspect) {
                    // fallback to an empty string in introspection mode.
                    return '';
                }
                throw error;
            }
        },
        async read(filePath, config) {
            let modResults;
            try {
                if (!config.modRequest.ignoreExistingNativeFiles && fs_1.default.existsSync(filePath)) {
                    const contents = await readFile(filePath, 'utf8');
                    (0, assert_1.default)(contents, 'Entitlements plist is empty');
                    modResults = plist_1.default.parse(contents);
                }
                else {
                    modResults = getEntitlementsPlistTemplate();
                }
            }
            catch (error) {
                // Throw errors in introspection mode.
                if (!config.modRequest.introspect) {
                    throw error;
                }
                // Fallback to using the template file.
                modResults = getEntitlementsPlistTemplate();
            }
            // Apply all of the .entitlements values to the expo.ios.entitlements object
            // TODO: Remove this in favor of just overwriting the .entitlements with the Expo object. This will enable people to actually remove values.
            if (!config.ios)
                config.ios = {};
            if (!config.ios.entitlements)
                config.ios.entitlements = {};
            config.ios.entitlements = {
                ...(modResults || {}),
                ...config.ios.entitlements,
            };
            return config.ios.entitlements;
        },
        async write(filePath, config) {
            // Update the contents of the static entitlements object
            if (!config.ios) {
                config.ios = {};
            }
            config.ios.entitlements = config.modResults;
            // Return early without writing, in introspection mode.
            if (config.modRequest.introspect) {
                return;
            }
            await writeFile(filePath, plist_1.default.build((0, sortObject_1.sortObject)(config.modResults)));
        },
    }),
    // Append a rule to supply Podfile.properties.json data to mods on `mods.ios.podfileProperties`
    podfileProperties: (0, createBaseMod_1.provider)({
        isIntrospective: true,
        getFilePath({ modRequest: { platformProjectRoot } }) {
            return path_1.default.resolve(platformProjectRoot, 'Podfile.properties.json');
        },
        async read(filePath) {
            let results = {};
            try {
                results = await json_file_1.default.readAsync(filePath);
            }
            catch { }
            return results;
        },
        async write(filePath, { modResults, modRequest: { introspect } }) {
            if (introspect) {
                return;
            }
            await json_file_1.default.writeAsync(filePath, modResults);
        },
    }),
};
function withIosBaseMods(config, { providers, ...props } = {}) {
    return (0, createBaseMod_1.withGeneratedBaseMods)(config, {
        ...props,
        platform: 'ios',
        providers: providers ?? getIosModFileProviders(),
    });
}
exports.withIosBaseMods = withIosBaseMods;
function getIosModFileProviders() {
    return defaultProviders;
}
exports.getIosModFileProviders = getIosModFileProviders;
