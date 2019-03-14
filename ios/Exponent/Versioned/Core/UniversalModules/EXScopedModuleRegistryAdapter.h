// Copyright © 2018 650 Industries. All rights reserved.

#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>

@interface EXScopedModuleRegistryAdapter : UMModuleRegistryAdapter

- (NSArray<id<RCTBridgeModule>> *)extraModulesForParams:(NSDictionary *)params andExperience:(NSString *)experienceId withScopedModulesArray:(NSArray *)scopedModulesArray withKernelServices:(NSDictionary *)kernelServices;

@end
