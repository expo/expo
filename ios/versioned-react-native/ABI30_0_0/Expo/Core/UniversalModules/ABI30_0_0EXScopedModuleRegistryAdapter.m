// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI30_0_0EXScopedModuleRegistry.h"

#import "ABI30_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI30_0_0EXFileSystemBinding.h"
#import "ABI30_0_0EXSensorsManagerBinding.h"
#import "ABI30_0_0EXConstantsBinding.h"
#import "ABI30_0_0EXUnversioned.h"

#import "ABI30_0_0EXModuleRegistryBinding.h"

@implementation ABI30_0_0EXScopedModuleRegistryAdapter

- (NSArray<id<ABI30_0_0RCTBridgeModule>> *)extraModulesForParams:(NSDictionary *)params andExperience:(NSString *)experienceId withScopedModulesArray:(NSArray<id<ABI30_0_0RCTBridgeModule>> *)scopedModulesArray withKernelServices:(NSDictionary *)kernelServices
{
  ABI30_0_0EXModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistryForExperienceId:experienceId];

  ABI30_0_0EXFileSystemBinding *fileSystemBinding = [[ABI30_0_0EXFileSystemBinding alloc] init];
  [moduleRegistry registerInternalModule:fileSystemBinding];

  ABI30_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI30_0_0EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
  
  ABI30_0_0EXConstantsBinding *constantsBinding = [[ABI30_0_0EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];

  NSArray<id<ABI30_0_0RCTBridgeModule>> *bridgeModules = [self extraModulesForModuleRegistry:moduleRegistry];
  return [bridgeModules arrayByAddingObject:[[ABI30_0_0EXModuleRegistryBinding alloc] initWithModuleRegistry:moduleRegistry]];
}

- (NSDictionary<Class, id> *)dictionaryFromScopedModulesArray:(NSArray<id<ABI30_0_0RCTBridgeModule>> *)scopedModulesArray
{
  NSMutableDictionary<Class, id> *scopedModulesDictionary = [NSMutableDictionary dictionaryWithCapacity:[scopedModulesArray count]];
  for (id<ABI30_0_0RCTBridgeModule> module in scopedModulesArray) {
    scopedModulesDictionary[(id<NSCopying>)[module class]] = module;
  }
  return scopedModulesDictionary;
}

@end
