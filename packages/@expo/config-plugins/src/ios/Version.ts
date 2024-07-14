import * as AppleImpl from '../apple/Version';

export const withVersion = AppleImpl.withVersion('ios');
export const withBuildNumber = AppleImpl.withBuildNumber('ios');
export const getBuildNumber = AppleImpl.getBuildNumber('ios');
export const setBuildNumber = AppleImpl.setBuildNumber('ios');

export {
  getVersion, setVersion
} from '../apple/Version';
