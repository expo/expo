// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryAdapter.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistry.h>
#import <ABI46_0_0EXManifests/ABI46_0_0EXManifestsManifest.h>

@interface ABI46_0_0EXScopedModuleRegistryAdapter : ABI46_0_0EXModuleRegistryAdapter

- (ABI46_0_0EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(ABI46_0_0EXManifestsManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices;

@end
