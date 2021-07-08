// Copyright © 2018 650 Industries. All rights reserved.

#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>
#import <UMCore/UMModuleRegistry.h>
#import <EXUpdates/EXUpdatesRawManifest.h>

@interface EXScopedModuleRegistryAdapter : UMModuleRegistryAdapter

- (UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(EXUpdatesRawManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices;

@end
