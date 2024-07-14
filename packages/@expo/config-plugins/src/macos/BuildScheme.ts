import * as AppleImpl from '../apple/BuildScheme';

export const getSchemesFromXcodeproj = AppleImpl.getSchemesFromXcodeproj('macos');

export const getRunnableSchemesFromXcodeproj = AppleImpl.getRunnableSchemesFromXcodeproj('macos');

export const getApplicationTargetNameForSchemeAsync =
  AppleImpl.getApplicationTargetNameForSchemeAsync('macos');

export const getArchiveBuildConfigurationForSchemeAsync =
  AppleImpl.getArchiveBuildConfigurationForSchemeAsync('macos');
