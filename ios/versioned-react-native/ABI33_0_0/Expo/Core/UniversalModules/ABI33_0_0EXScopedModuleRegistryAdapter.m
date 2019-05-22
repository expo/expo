// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI33_0_0EXScopedModuleRegistry.h"

#import "ABI33_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI33_0_0EXSensorsManagerBinding.h"
#import "ABI33_0_0EXConstantsBinding.h"
#import "ABI33_0_0EXScopedFileSystemModule.h"
#import "ABI33_0_0EXUnversioned.h"
#import "ABI33_0_0EXScopedFilePermissionModule.h"
#import "ABI33_0_0EXScopedSecureStore.h"
#import "ABI33_0_0EXScopedAmplitude.h"
#import "ABI33_0_0EXScopedPermissions.h"

#import "ABI33_0_0EXScopedReactNativeAdapter.h"
#import "ABI33_0_0EXModuleRegistryBinding.h"
#import "ABI33_0_0EXExpoUserNotificationCenterProxy.h"

@implementation ABI33_0_0EXScopedModuleRegistryAdapter

- (ABI33_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices
{
  ABI33_0_0UMModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

  ABI33_0_0EXConstantsBinding *constantsBinding = [[ABI33_0_0EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];

  ABI33_0_0EXScopedFileSystemModule *fileSystemModule = [[ABI33_0_0EXScopedFileSystemModule alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];

  ABI33_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI33_0_0EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];

  ABI33_0_0EXScopedReactNativeAdapter *ReactABI33_0_0NativeAdapter = [[ABI33_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ReactABI33_0_0NativeAdapter];

  ABI33_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI33_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

  ABI33_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI33_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];

  ABI33_0_0EXScopedSecureStore *secureStoreModule = [[ABI33_0_0EXScopedSecureStore alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:secureStoreModule];

  ABI33_0_0EXScopedAmplitude *amplitudeModule = [[ABI33_0_0EXScopedAmplitude alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:amplitudeModule];

  ABI33_0_0EXScopedPermissions *permissionsModule = [[ABI33_0_0EXScopedPermissions alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];

  return moduleRegistry;
}

- (NSArray<id<ABI33_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  return [[super extraModulesForModuleRegistry:moduleRegistry] arrayByAddingObject:[[ABI33_0_0EXModuleRegistryBinding alloc] initWithModuleRegistry:moduleRegistry]];
}

@end
