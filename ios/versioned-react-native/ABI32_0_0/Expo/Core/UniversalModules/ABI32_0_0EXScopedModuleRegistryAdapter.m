// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI32_0_0EXScopedModuleRegistry.h"

#import "ABI32_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI32_0_0EXFileSystemBinding.h"
#import "ABI32_0_0EXSensorsManagerBinding.h"
#import "ABI32_0_0EXConstantsBinding.h"
#import "ABI32_0_0EXUnversioned.h"
#import "ABI32_0_0EXScopedFilePermissionModule.h"

#import "EXScopedReactABI32_0_0NativeAdapter.h"
#import "ABI32_0_0EXModuleRegistryBinding.h"
#import "ABI32_0_0EXExpoUserNotificationCenterProxy.h"

@implementation ABI32_0_0EXScopedModuleRegistryAdapter

- (NSArray<id<ABI32_0_0RCTBridgeModule>> *)extraModulesForParams:(NSDictionary *)params andExperience:(NSString *)experienceId withScopedModulesArray:(NSArray<id<ABI32_0_0RCTBridgeModule>> *)scopedModulesArray withKernelServices:(NSDictionary *)kernelServices
{
  ABI32_0_0EXModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistryForExperienceId:experienceId];

  ABI32_0_0EXFileSystemBinding *fileSystemBinding = [[ABI32_0_0EXFileSystemBinding alloc] init];
  [moduleRegistry registerInternalModule:fileSystemBinding];

  ABI32_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI32_0_0EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
  
  ABI32_0_0EXConstantsBinding *constantsBinding = [[ABI32_0_0EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];

  ABI32_0_0EXScopedReactABI32_0_0NativeAdapter *ReactABI32_0_0NativeAdapter = [[ABI32_0_0EXScopedReactABI32_0_0NativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ReactABI32_0_0NativeAdapter];

  ABI32_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI32_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

  ABI32_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI32_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];

  NSArray<id<ABI32_0_0RCTBridgeModule>> *bridgeModules = [self extraModulesForModuleRegistry:moduleRegistry];
  return [bridgeModules arrayByAddingObject:[[ABI32_0_0EXModuleRegistryBinding alloc] initWithModuleRegistry:moduleRegistry]];
}

- (NSDictionary<Class, id> *)dictionaryFromScopedModulesArray:(NSArray<id<ABI32_0_0RCTBridgeModule>> *)scopedModulesArray
{
  NSMutableDictionary<Class, id> *scopedModulesDictionary = [NSMutableDictionary dictionaryWithCapacity:[scopedModulesArray count]];
  for (id<ABI32_0_0RCTBridgeModule> module in scopedModulesArray) {
    scopedModulesDictionary[(id<NSCopying>)[module class]] = module;
  }
  return scopedModulesDictionary;
}

@end
