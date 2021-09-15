// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI42_0_0UMReactNativeAdapter/ABI42_0_0UMModuleRegistryAdapter.h>
#import <ABI42_0_0EXManifests/ABI42_0_0EXManifestsManifest.h>

@interface ABI42_0_0EXScopedModuleRegistryAdapter : ABI42_0_0UMModuleRegistryAdapter

- (ABI42_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                           forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                              scopeKey:(NSString *)scopeKey
                                              manifest:(ABI42_0_0EXManifestsManifest *)manifest
                                    withKernelServices:(NSDictionary *)kernelServices;

@end
