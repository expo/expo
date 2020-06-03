// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI38_0_0UMReactNativeAdapter/ABI38_0_0UMModuleRegistryAdapter.h>

@interface ABI38_0_0EXScopedModuleRegistryAdapter : ABI38_0_0UMModuleRegistryAdapter

- (ABI38_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices;

@end
