// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMModuleRegistryAdapter.h>
#import <ABI40_0_0EXManifests/ABI40_0_0EXManifestsRawManifest.h>

@interface ABI40_0_0EXScopedModuleRegistryAdapter : ABI40_0_0UMModuleRegistryAdapter

- (ABI40_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                           forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                              scopeKey:(NSString *)scopeKey
                                              manifest:(ABI40_0_0EXManifestsRawManifest *)manifest
                                    withKernelServices:(NSDictionary *)kernelServices;

@end
