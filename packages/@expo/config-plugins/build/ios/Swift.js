"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withNoopSwiftFile = exports.createBridgingHeaderFile = exports.linkBridgingHeaderFile = exports.getDesignatedSwiftBridgingHeaderFileReference = exports.ensureSwiftBridgingHeaderSetup = exports.withSwiftBridgingHeader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Paths_1 = require("./Paths");
const XcodeProjectFile_1 = require("./XcodeProjectFile");
const Xcodeproj_1 = require("./utils/Xcodeproj");
const ios_plugins_1 = require("../plugins/ios-plugins");
const templateBridgingHeader = `//
//  Use this file to import your target's public headers that you would like to expose to Swift.
//
`;
/**
 * Ensure a Swift bridging header is created for the project.
 * This helps fix problems related to using modules that are written in Swift (lottie, FBSDK).
 *
 * 1. Ensures the file exists given the project path.
 * 2. Writes the file and links to Xcode as a resource file.
 * 3. Sets the build configuration `SWIFT_OBJC_BRIDGING_HEADER = [PROJECT_NAME]-Bridging-Header.h`
 */
const withSwiftBridgingHeader = (config) => {
    return (0, ios_plugins_1.withXcodeProject)(config, (config) => {
        config.modResults = ensureSwiftBridgingHeaderSetup({
            project: config.modResults,
            projectRoot: config.modRequest.projectRoot,
        });
        return config;
    });
};
exports.withSwiftBridgingHeader = withSwiftBridgingHeader;
function ensureSwiftBridgingHeaderSetup({ projectRoot, project, }) {
    // Only create a bridging header if using objective-c
    if (shouldCreateSwiftBridgingHeader({ projectRoot, project })) {
        const projectName = (0, Xcodeproj_1.getProjectName)(projectRoot);
        const bridgingHeader = createBridgingHeaderFileName(projectName);
        // Ensure a bridging header is created in the Xcode project.
        project = createBridgingHeaderFile({
            project,
            projectName,
            projectRoot,
            bridgingHeader,
        });
        // Designate the newly created file as the Swift bridging header in the Xcode project.
        project = linkBridgingHeaderFile({
            project,
            bridgingHeader: path_1.default.join(projectName, bridgingHeader),
        });
    }
    return project;
}
exports.ensureSwiftBridgingHeaderSetup = ensureSwiftBridgingHeaderSetup;
function shouldCreateSwiftBridgingHeader({ projectRoot, project, }) {
    // Only create a bridging header if the project is using in Objective C (AppDelegate is written in Objc).
    const isObjc = (0, Paths_1.getAppDelegate)(projectRoot).language !== 'swift';
    return isObjc && !getDesignatedSwiftBridgingHeaderFileReference({ project });
}
/**
 * @returns String matching the default name used when Xcode automatically creates a bridging header file.
 */
function createBridgingHeaderFileName(projectName) {
    return `${projectName}-Bridging-Header.h`;
}
function getDesignatedSwiftBridgingHeaderFileReference({ project, }) {
    const configurations = project.pbxXCBuildConfigurationSection();
    // @ts-ignore
    for (const { buildSettings } of Object.values(configurations || {})) {
        // Guessing that this is the best way to emulate Xcode.
        // Using `project.addToBuildSettings` modifies too many targets.
        if (typeof buildSettings?.PRODUCT_NAME !== 'undefined') {
            if (typeof buildSettings.SWIFT_OBJC_BRIDGING_HEADER === 'string' &&
                buildSettings.SWIFT_OBJC_BRIDGING_HEADER) {
                return buildSettings.SWIFT_OBJC_BRIDGING_HEADER;
            }
        }
    }
    return null;
}
exports.getDesignatedSwiftBridgingHeaderFileReference = getDesignatedSwiftBridgingHeaderFileReference;
/**
 *
 * @param bridgingHeader The bridging header filename ex: `ExpoAPIs-Bridging-Header.h`
 * @returns
 */
function linkBridgingHeaderFile({ project, bridgingHeader, }) {
    const configurations = project.pbxXCBuildConfigurationSection();
    // @ts-ignore
    for (const { buildSettings } of Object.values(configurations || {})) {
        // Guessing that this is the best way to emulate Xcode.
        // Using `project.addToBuildSettings` modifies too many targets.
        if (typeof buildSettings?.PRODUCT_NAME !== 'undefined') {
            buildSettings.SWIFT_OBJC_BRIDGING_HEADER = bridgingHeader;
        }
    }
    return project;
}
exports.linkBridgingHeaderFile = linkBridgingHeaderFile;
function createBridgingHeaderFile({ projectRoot, projectName, project, bridgingHeader, }) {
    const bridgingHeaderProjectPath = path_1.default.join((0, Paths_1.getSourceRoot)(projectRoot), bridgingHeader);
    if (!fs_1.default.existsSync(bridgingHeaderProjectPath)) {
        // Create the file
        fs_1.default.writeFileSync(bridgingHeaderProjectPath, templateBridgingHeader, 'utf8');
    }
    // This is non-standard, Xcode generates the bridging header in `/ios` which is kinda annoying.
    // Instead, this'll generate the default header in the application code folder `/ios/myproject/`.
    const filePath = `${projectName}/${bridgingHeader}`;
    // Ensure the file is linked with Xcode resource files
    if (!project.hasFile(filePath)) {
        project = (0, Xcodeproj_1.addResourceFileToGroup)({
            filepath: filePath,
            groupName: projectName,
            project,
            // Not sure why, but this is how Xcode generates it.
            isBuildFile: false,
            verbose: false,
        });
    }
    return project;
}
exports.createBridgingHeaderFile = createBridgingHeaderFile;
const withNoopSwiftFile = (config) => {
    return (0, XcodeProjectFile_1.withBuildSourceFile)(config, {
        filePath: 'noop-file.swift',
        contents: [
            '//',
            '// @generated',
            '// A blank Swift file must be created for native modules with Swift files to work correctly.',
            '//',
            '',
        ].join('\n'),
    });
};
exports.withNoopSwiftFile = withNoopSwiftFile;
