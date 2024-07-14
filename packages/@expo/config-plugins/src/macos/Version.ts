import * as AppleImpl from '../apple/Version';

export const withVersion = AppleImpl.withVersion('macos');
export const withBuildNumber = AppleImpl.withBuildNumber('macos');
export const getBuildNumber = AppleImpl.getBuildNumber('macos');
export const setBuildNumber = AppleImpl.setBuildNumber('macos');

export { getVersion, setVersion } from '../apple/Version';
