// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI37_0_0UMReactNativeAdapter/ABI37_0_0UMModuleRegistryAdapter.h>

@interface ABI37_0_0EXScopedModuleRegistryAdapter : ABI37_0_0UMModuleRegistryAdapter

- (ABI37_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices;

@end
