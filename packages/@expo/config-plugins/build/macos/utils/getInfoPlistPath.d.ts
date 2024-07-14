/// <reference types="xcode" />
export declare const getInfoPlistPathFromPbxproj: (projectRootOrProject: string | import("xcode").XcodeProject, { targetName, buildConfiguration, }?: {
    targetName?: string | undefined;
    buildConfiguration?: string | undefined;
}) => string | null;
