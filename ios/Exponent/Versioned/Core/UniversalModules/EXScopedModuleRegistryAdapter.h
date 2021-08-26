// Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXModuleRegistryAdapter.h>
#import <ExpoModulesCore/EXModuleRegistry.h>
#import <EXRawManifests/EXRawManifestsRawManifest.h>

@interface EXScopedModuleRegistryAdapter : EXModuleRegistryAdapter

- (EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(EXRawManifestsRawManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices;

@end
