import { ConfigPlugin, XcodeProject } from '@expo/config-plugins';
/**
 * Exclude building for arm64 on simulator devices in the pbxproj project.
 * Without this, production builds targeting simulators will fail.
 */
export declare function setExcludedArchitectures(project: XcodeProject): XcodeProject;
declare const _default: ConfigPlugin<void>;
export default _default;
