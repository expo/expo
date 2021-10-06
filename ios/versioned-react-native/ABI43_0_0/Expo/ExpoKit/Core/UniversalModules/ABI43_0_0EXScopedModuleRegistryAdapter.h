// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryAdapter.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistry.h>
#import <ABI43_0_0EXManifests/ABI43_0_0EXManifestsManifest.h>

@interface ABI43_0_0EXScopedModuleRegistryAdapter : ABI43_0_0EXModuleRegistryAdapter

- (ABI43_0_0EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(ABI43_0_0EXManifestsManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices;

@end
