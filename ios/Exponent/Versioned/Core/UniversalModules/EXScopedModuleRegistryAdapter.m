// Copyright © 2018 650 Industries. All rights reserved.

#import "EXScopedModuleRegistry.h"

#import "EXScopedModuleRegistryAdapter.h"
#import "EXFileSystemBinding.h"
#import "EXSensorsManagerBinding.h"
#import "EXConstantsBinding.h"
#import "EXUnversioned.h"

#import "EXModuleRegistryBinding.h"

@implementation EXScopedModuleRegistryAdapter

- (NSArray<id<RCTBridgeModule>> *)extraModulesForParams:(NSDictionary *)params andExperience:(NSString *)experienceId withScopedModulesArray:(NSArray<id<RCTBridgeModule>> *)scopedModulesArray withKernelServices:(NSDictionary *)kernelServices
{
  EXModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistryForExperienceId:experienceId];

  EXFileSystemBinding *fileSystemBinding = [[EXFileSystemBinding alloc] init];
  [moduleRegistry registerInternalModule:fileSystemBinding];

  EXSensorsManagerBinding *sensorsManagerBinding = [[EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[EX_UNVERSIONED(@"EXSensorManager")]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
  
  EXConstantsBinding *constantsBinding = [[EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];

  NSArray<id<RCTBridgeModule>> *bridgeModules = [self extraModulesForModuleRegistry:moduleRegistry];
  return [bridgeModules arrayByAddingObject:[[EXModuleRegistryBinding alloc] initWithModuleRegistry:moduleRegistry]];
}

- (NSDictionary<Class, id> *)dictionaryFromScopedModulesArray:(NSArray<id<RCTBridgeModule>> *)scopedModulesArray
{
  NSMutableDictionary<Class, id> *scopedModulesDictionary = [NSMutableDictionary dictionaryWithCapacity:[scopedModulesArray count]];
  for (id<RCTBridgeModule> module in scopedModulesArray) {
    scopedModulesDictionary[(id<NSCopying>)[module class]] = module;
  }
  return scopedModulesDictionary;
}

@end
