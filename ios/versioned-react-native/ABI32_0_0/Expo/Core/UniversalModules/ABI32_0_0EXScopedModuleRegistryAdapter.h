// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI32_0_0EXReactNativeAdapter/ABI32_0_0EXModuleRegistryAdapter.h>

@interface ABI32_0_0EXScopedModuleRegistryAdapter : ABI32_0_0EXModuleRegistryAdapter

- (NSArray<id<ABI32_0_0RCTBridgeModule>> *)extraModulesForParams:(NSDictionary *)params andExperience:(NSString *)experienceId withScopedModulesArray:(NSArray *)scopedModulesArray withKernelServices:(NSDictionary *)kernelServices;

@end
