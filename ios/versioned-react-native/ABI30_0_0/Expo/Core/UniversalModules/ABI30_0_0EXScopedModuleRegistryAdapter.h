// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI30_0_0EXReactNativeAdapter/ABI30_0_0EXModuleRegistryAdapter.h>

@interface ABI30_0_0EXScopedModuleRegistryAdapter : ABI30_0_0EXModuleRegistryAdapter

- (NSArray<id<ABI30_0_0RCTBridgeModule>> *)extraModulesForParams:(NSDictionary *)params andExperience:(NSString *)experienceId withScopedModulesArray:(NSArray *)scopedModulesArray withKernelServices:(NSDictionary *)kernelServices;

@end
