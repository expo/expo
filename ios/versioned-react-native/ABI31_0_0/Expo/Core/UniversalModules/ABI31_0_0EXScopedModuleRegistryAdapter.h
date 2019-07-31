// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI31_0_0EXReactNativeAdapter/ABI31_0_0EXModuleRegistryAdapter.h>

@interface ABI31_0_0EXScopedModuleRegistryAdapter : ABI31_0_0EXModuleRegistryAdapter

- (NSArray<id<ABI31_0_0RCTBridgeModule>> *)extraModulesForParams:(NSDictionary *)params andExperience:(NSString *)experienceId withScopedModulesArray:(NSArray *)scopedModulesArray withKernelServices:(NSDictionary *)kernelServices;

@end
