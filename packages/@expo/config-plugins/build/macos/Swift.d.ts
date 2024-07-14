/// <reference types="xcode" />
export declare const withSwiftBridgingHeader: import("..").ConfigPlugin;
export declare const ensureSwiftBridgingHeaderSetup: ({ projectRoot, project }: {
    projectRoot: string;
    project: import("xcode").XcodeProject;
}) => import("xcode").XcodeProject;
export declare const createBridgingHeaderFile: ({ projectRoot, projectName, project, bridgingHeader, }: {
    project: import("xcode").XcodeProject;
    projectName: string;
    projectRoot: string;
    bridgingHeader: string;
}) => import("xcode").XcodeProject;
export declare const withNoopSwiftFile: import("..").ConfigPlugin;
export { getDesignatedSwiftBridgingHeaderFileReference, linkBridgingHeaderFile, } from '../apple/Swift';
