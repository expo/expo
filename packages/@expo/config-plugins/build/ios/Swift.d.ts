/// <reference types="xcode" />
import { ConfigPlugin, XcodeProject } from '../Plugin.types';
/**
 * Ensure a Swift bridging header is created for the project.
 * This helps fix problems related to using modules that are written in Swift (lottie, FBSDK).
 *
 * 1. Ensures the file exists given the project path.
 * 2. Writes the file and links to Xcode as a resource file.
 * 3. Sets the build configuration `SWIFT_OBJC_BRIDGING_HEADER = [PROJECT_NAME]-Bridging-Header.h`
 */
export declare const withSwiftBridgingHeader: ConfigPlugin;
export declare function ensureSwiftBridgingHeaderSetup({ projectRoot, project, }: {
    projectRoot: string;
    project: XcodeProject;
}): XcodeProject;
export declare function getDesignatedSwiftBridgingHeaderFileReference({ project, }: {
    project: XcodeProject;
}): string | null;
/**
 *
 * @param bridgingHeader The bridging header filename ex: `ExpoAPIs-Bridging-Header.h`
 * @returns
 */
export declare function linkBridgingHeaderFile({ project, bridgingHeader, }: {
    project: XcodeProject;
    bridgingHeader: string;
}): XcodeProject;
export declare function createBridgingHeaderFile({ projectRoot, projectName, project, bridgingHeader, }: {
    project: XcodeProject;
    projectName: string;
    projectRoot: string;
    bridgingHeader: string;
}): XcodeProject;
export declare const withNoopSwiftFile: ConfigPlugin;
