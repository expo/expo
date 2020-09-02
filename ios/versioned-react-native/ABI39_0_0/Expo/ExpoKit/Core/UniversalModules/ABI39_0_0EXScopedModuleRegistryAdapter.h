// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI39_0_0UMReactNativeAdapter/ABI39_0_0UMModuleRegistryAdapter.h>

@interface ABI39_0_0EXScopedModuleRegistryAdapter : ABI39_0_0UMModuleRegistryAdapter

- (ABI39_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices;

@end
