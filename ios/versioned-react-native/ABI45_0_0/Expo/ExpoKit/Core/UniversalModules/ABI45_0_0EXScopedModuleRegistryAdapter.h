// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryAdapter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistry.h>
#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsManifest.h>

@interface ABI45_0_0EXScopedModuleRegistryAdapter : ABI45_0_0EXModuleRegistryAdapter

- (ABI45_0_0EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(ABI45_0_0EXManifestsManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices;

@end
