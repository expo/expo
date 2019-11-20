// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI36_0_0UMReactNativeAdapter/ABI36_0_0UMModuleRegistryAdapter.h>

@interface ABI36_0_0EXScopedModuleRegistryAdapter : ABI36_0_0UMModuleRegistryAdapter

- (ABI36_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices;

@end
