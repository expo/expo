import { PBXNativeTarget, XCBuildConfiguration, XcodeProject } from 'xcode';
import { NativeTargetSectionEntry } from './utils/Xcodeproj';
export declare enum TargetType {
    APPLICATION = "com.apple.product-type.application",
    EXTENSION = "com.apple.product-type.app-extension",
    WATCH = "com.apple.product-type.application.watchapp",
    APP_CLIP = "com.apple.product-type.application.on-demand-install-capable",
    STICKER_PACK_EXTENSION = "com.apple.product-type.app-extension.messages-sticker-pack",
    FRAMEWORK = "com.apple.product-type.framework",
    OTHER = "other"
}
export interface Target {
    name: string;
    type: TargetType;
    signable: boolean;
    dependencies?: Target[];
}
export declare function getXCBuildConfigurationFromPbxproj(project: XcodeProject, { targetName, buildConfiguration, }?: {
    targetName?: string;
    buildConfiguration?: string;
}): XCBuildConfiguration | null;
export declare function findApplicationTargetWithDependenciesAsync(projectRoot: string, scheme: string): Promise<Target>;
export declare function isTargetOfType(target: PBXNativeTarget, targetType: TargetType): boolean;
export declare function getNativeTargets(project: XcodeProject): NativeTargetSectionEntry[];
export declare function findSignableTargets(project: XcodeProject): NativeTargetSectionEntry[];
export declare function findFirstNativeTarget(project: XcodeProject): NativeTargetSectionEntry;
export declare function findNativeTargetByName(project: XcodeProject, targetName: string): NativeTargetSectionEntry;
