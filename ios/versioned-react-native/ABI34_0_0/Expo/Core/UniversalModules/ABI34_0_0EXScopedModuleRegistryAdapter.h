// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI34_0_0UMReactNativeAdapter/ABI34_0_0UMModuleRegistryAdapter.h>

@interface ABI34_0_0EXScopedModuleRegistryAdapter : ABI34_0_0UMModuleRegistryAdapter

- (ABI34_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices;

@end
