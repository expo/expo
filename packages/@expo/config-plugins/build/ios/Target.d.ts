import * as AppleImpl from '../apple/Target';
export declare const findApplicationTargetWithDependenciesAsync: (projectRoot: string, scheme: string) => Promise<AppleImpl.Target>;
export type { Target } from '../apple/Target';
export { TargetType, getXCBuildConfigurationFromPbxproj, isTargetOfType, getNativeTargets, findSignableTargets, findFirstNativeTarget, findNativeTargetByName, } from '../apple/Target';
