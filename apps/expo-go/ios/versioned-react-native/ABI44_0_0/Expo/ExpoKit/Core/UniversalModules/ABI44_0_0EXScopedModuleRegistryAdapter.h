// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistryAdapter.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistry.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsManifest.h>

@interface ABI44_0_0EXScopedModuleRegistryAdapter : ABI44_0_0EXModuleRegistryAdapter

- (ABI44_0_0EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(ABI44_0_0EXManifestsManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices;

@end
