// Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistryAdapter.h>
#import <ExpoModulesCore/EXModuleRegistry.h>

@class EXManifestsManifest;

@interface EXScopedModuleRegistryAdapter : EXModuleRegistryAdapter

- (nonnull EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                          forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                             scopeKey:(NSString *)scopeKey
                                             manifest:(EXManifestsManifest *)manifest
                                   withKernelServices:(NSDictionary *)kernelServices;

@end
