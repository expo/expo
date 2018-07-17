// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI29_0_0EXReactNativeAdapter/ABI29_0_0EXModuleRegistryAdapter.h>

@interface ABI29_0_0EXScopedModuleRegistryAdapter : ABI29_0_0EXModuleRegistryAdapter

- (NSArray<id<ABI29_0_0RCTBridgeModule>> *)extraModulesForParams:(NSDictionary *)params andExperience:(NSString *)experienceId withScopedModulesArray:(NSArray *)scopedModulesArray withKernelServices:(NSDictionary *)kernelServices;

@end
