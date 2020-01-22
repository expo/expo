// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI34_0_0EXScopedModuleRegistry.h"

#import "ABI34_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI34_0_0EXSensorsManagerBinding.h"
#import "ABI34_0_0EXConstantsBinding.h"
#import "ABI34_0_0EXScopedFileSystemModule.h"
#import "ABI34_0_0EXUnversioned.h"
#import "ABI34_0_0EXScopedFilePermissionModule.h"
#import "ABI34_0_0EXScopedFontLoader.h"
#import "ABI34_0_0EXScopedSecureStore.h"
#import "ABI34_0_0EXScopedAmplitude.h"
#import "ABI34_0_0EXScopedPermissions.h"
#import "ABI34_0_0EXScopedSegment.h"
#import "ABI34_0_0EXScopedLocalAuthentication.h"

#import "ABI34_0_0EXScopedReactNativeAdapter.h"
#import "ABI34_0_0EXModuleRegistryBinding.h"
#import "ABI34_0_0EXExpoUserNotificationCenterProxy.h"

#if __has_include(<ABI34_0_0EXTaskManager/ABI34_0_0EXTaskManager.h>)
#import <ABI34_0_0EXTaskManager/ABI34_0_0EXTaskManager.h>
#endif

@implementation ABI34_0_0EXScopedModuleRegistryAdapter

- (ABI34_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices
{
  ABI34_0_0UMModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<ABI34_0_0EXConstants/ABI34_0_0EXConstantsService.h>)
  ABI34_0_0EXConstantsBinding *constantsBinding = [[ABI34_0_0EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<ABI34_0_0EXFileSystem/ABI34_0_0EXFileSystem.h>)
  ABI34_0_0EXScopedFileSystemModule *fileSystemModule = [[ABI34_0_0EXScopedFileSystemModule alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];
#endif

#if __has_include(<ABI34_0_0EXFont/ABI34_0_0EXFontLoader.h>)
  ABI34_0_0EXScopedFontLoader *fontModule = [[ABI34_0_0EXScopedFontLoader alloc] init];
  [moduleRegistry registerExportedModule:fontModule];
#endif

#if __has_include(<ABI34_0_0EXSensors/ABI34_0_0EXSensorsManager.h>)
  ABI34_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI34_0_0EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
#endif

  ABI34_0_0EXScopedReactNativeAdapter *ReactABI34_0_0NativeAdapter = [[ABI34_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ReactABI34_0_0NativeAdapter];

  ABI34_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI34_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<ABI34_0_0EXFileSystem/ABI34_0_0EXFilePermissionModule.h>)
  ABI34_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI34_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];
#endif

#if __has_include(<ABI34_0_0EXSecureStore/ABI34_0_0EXSecureStore.h>)
  ABI34_0_0EXScopedSecureStore *secureStoreModule = [[ABI34_0_0EXScopedSecureStore alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<ABI34_0_0EXAmplitude/ABI34_0_0EXAmplitude.h>)
  ABI34_0_0EXScopedAmplitude *amplitudeModule = [[ABI34_0_0EXScopedAmplitude alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:amplitudeModule];
#endif

#if __has_include(<ABI34_0_0EXPermissions/ABI34_0_0EXPermissions.h>)
  ABI34_0_0EXScopedPermissions *permissionsModule = [[ABI34_0_0EXScopedPermissions alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<ABI34_0_0EXSegment/ABI34_0_0EXSegment.h>)
  ABI34_0_0EXScopedSegment *segmentModule = [[ABI34_0_0EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<ABI34_0_0EXLocalAuthentication/ABI34_0_0EXLocalAuthentication.h>)
  ABI34_0_0EXScopedLocalAuthentication *localAuthenticationModule = [[ABI34_0_0EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<ABI34_0_0EXTaskManager/ABI34_0_0EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare ReactABI34_0_0 Native
  ABI34_0_0EXTaskManager *taskManagerModule = [[ABI34_0_0EXTaskManager alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif

  return moduleRegistry;
}

- (NSArray<id<ABI34_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  return [[super extraModulesForModuleRegistry:moduleRegistry] arrayByAddingObject:[[ABI34_0_0EXModuleRegistryBinding alloc] initWithModuleRegistry:moduleRegistry]];
}

@end
