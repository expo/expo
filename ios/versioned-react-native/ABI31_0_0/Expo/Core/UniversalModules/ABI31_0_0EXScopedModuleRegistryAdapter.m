// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI31_0_0EXScopedModuleRegistry.h"

#import "ABI31_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI31_0_0EXFileSystemBinding.h"
#import "ABI31_0_0EXSensorsManagerBinding.h"
#import "ABI31_0_0EXConstantsBinding.h"
#import "ABI31_0_0EXUnversioned.h"

#import "ABI31_0_0EXScopedReactNativeAdapter.h"
#import "ABI31_0_0EXModuleRegistryBinding.h"

@implementation ABI31_0_0EXScopedModuleRegistryAdapter

- (NSArray<id<ABI31_0_0RCTBridgeModule>> *)extraModulesForParams:(NSDictionary *)params andExperience:(NSString *)experienceId withScopedModulesArray:(NSArray<id<ABI31_0_0RCTBridgeModule>> *)scopedModulesArray withKernelServices:(NSDictionary *)kernelServices
{
  ABI31_0_0EXModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistryForExperienceId:experienceId];

  ABI31_0_0EXFileSystemBinding *fileSystemBinding = [[ABI31_0_0EXFileSystemBinding alloc] init];
  [moduleRegistry registerInternalModule:fileSystemBinding];

  ABI31_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI31_0_0EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
  
  ABI31_0_0EXConstantsBinding *constantsBinding = [[ABI31_0_0EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];

  ABI31_0_0EXScopedReactNativeAdapter *reactNativeAdapter = [[ABI31_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:reactNativeAdapter];

  NSArray<id<ABI31_0_0RCTBridgeModule>> *bridgeModules = [self extraModulesForModuleRegistry:moduleRegistry];
  return [bridgeModules arrayByAddingObject:[[ABI31_0_0EXModuleRegistryBinding alloc] initWithModuleRegistry:moduleRegistry]];
}

- (NSDictionary<Class, id> *)dictionaryFromScopedModulesArray:(NSArray<id<ABI31_0_0RCTBridgeModule>> *)scopedModulesArray
{
  NSMutableDictionary<Class, id> *scopedModulesDictionary = [NSMutableDictionary dictionaryWithCapacity:[scopedModulesArray count]];
  for (id<ABI31_0_0RCTBridgeModule> module in scopedModulesArray) {
    scopedModulesDictionary[(id<NSCopying>)[module class]] = module;
  }
  return scopedModulesDictionary;
}

@end
