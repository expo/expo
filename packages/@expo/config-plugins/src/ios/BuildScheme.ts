import * as AppleImpl from '../apple/BuildScheme';

export const getSchemesFromXcodeproj = AppleImpl.getSchemesFromXcodeproj('ios');

export const getRunnableSchemesFromXcodeproj = AppleImpl.getRunnableSchemesFromXcodeproj('ios');

export const getApplicationTargetNameForSchemeAsync = AppleImpl.getApplicationTargetNameForSchemeAsync('ios');

export const getArchiveBuildConfigurationForSchemeAsync = AppleImpl.getArchiveBuildConfigurationForSchemeAsync('ios');