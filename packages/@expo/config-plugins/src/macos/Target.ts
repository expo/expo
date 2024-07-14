import * as AppleImpl from '../apple/Target';

export const findApplicationTargetWithDependenciesAsync =
  AppleImpl.findApplicationTargetWithDependenciesAsync('macos');

export type { Target } from '../apple/Target';
export {
  TargetType,
  getXCBuildConfigurationFromPbxproj,
  isTargetOfType,
  getNativeTargets,
  findSignableTargets,
  findFirstNativeTarget,
  findNativeTargetByName,
} from '../apple/Target';
