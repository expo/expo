// Copyright © 2018 650 Industries. All rights reserved.

#import "EXScopedModuleRegistry.h"

#import "EXScopedModuleRegistryAdapter.h"
#import "EXSensorsManagerBinding.h"
#import "EXConstantsBinding.h"
#import "EXScopedFileSystemModule.h"
#import "EXUnversioned.h"
#import "EXScopedFilePermissionModule.h"
#import "EXScopedSecureStore.h"
#import "EXScopedAmplitude.h"
#import "EXScopedPermissions.h"

#import "EXScopedReactNativeAdapter.h"
#import "EXModuleRegistryBinding.h"
#import "EXExpoUserNotificationCenterProxy.h"

@implementation EXScopedModuleRegistryAdapter

- (UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices
{
  UMModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

  EXConstantsBinding *constantsBinding = [[EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];

  EXScopedFileSystemModule *fileSystemModule = [[EXScopedFileSystemModule alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];

  EXSensorsManagerBinding *sensorsManagerBinding = [[EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[EX_UNVERSIONED(@"EXSensorManager")]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];

  EXScopedReactNativeAdapter *reactNativeAdapter = [[EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:reactNativeAdapter];

  EXExpoUserNotificationCenterProxy *userNotificationCenter = [[EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[EX_UNVERSIONED(@"EXUserNotificationCenter")]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

  EXScopedFilePermissionModule *filePermissionModule = [[EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];

  EXScopedSecureStore *secureStoreModule = [[EXScopedSecureStore alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:secureStoreModule];

  EXScopedAmplitude *amplitudeModule = [[EXScopedAmplitude alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:amplitudeModule];

  EXScopedPermissions *permissionsModule = [[EXScopedPermissions alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];

  return moduleRegistry;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  return [[super extraModulesForModuleRegistry:moduleRegistry] arrayByAddingObject:[[EXModuleRegistryBinding alloc] initWithModuleRegistry:moduleRegistry]];
}

@end
