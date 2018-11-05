// Copyright © 2018 650 Industries. All rights reserved.

#import <EXReactNativeAdapter/EXModuleRegistryAdapter.h>

@interface EXScopedModuleRegistryAdapter : EXModuleRegistryAdapter

- (NSArray<id<RCTBridgeModule>> *)extraModulesForParams:(NSDictionary *)params andExperience:(NSString *)experienceId withScopedModulesArray:(NSArray *)scopedModulesArray withKernelServices:(NSDictionary *)kernelServices;

@end
