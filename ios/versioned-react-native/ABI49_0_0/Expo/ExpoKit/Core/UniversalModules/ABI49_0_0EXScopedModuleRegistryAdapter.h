// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryAdapter.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistry.h>

@class ABI49_0_0EXManifestsManifest;

@interface ABI49_0_0EXScopedModuleRegistryAdapter : ABI49_0_0EXModuleRegistryAdapter

- (ABI49_0_0EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(ABI49_0_0EXManifestsManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices;

@end
