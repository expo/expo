// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI35_0_0EXScopedModuleRegistry.h"

#import "ABI35_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI35_0_0EXSensorsManagerBinding.h"
#import "ABI35_0_0EXConstantsBinding.h"
#import "ABI35_0_0EXScopedFileSystemModule.h"
#import "ABI35_0_0EXUnversioned.h"
#import "ABI35_0_0EXScopedFilePermissionModule.h"
#import "ABI35_0_0EXScopedFontLoader.h"
#import "ABI35_0_0EXScopedSecureStore.h"
#import "ABI35_0_0EXScopedAmplitude.h"
#import "ABI35_0_0EXScopedPermissions.h"
#import "ABI35_0_0EXScopedSegment.h"
#import "ABI35_0_0EXScopedLocalAuthentication.h"
#import "ABI35_0_0EXScopedBranch.h"

#import "ABI35_0_0EXScopedReactNativeAdapter.h"
#import "ABI35_0_0EXModuleRegistryBinding.h"
#import "ABI35_0_0EXExpoUserNotificationCenterProxy.h"

#if __has_include(<ABI35_0_0EXTaskManager/ABI35_0_0EXTaskManager.h>)
#import <ABI35_0_0EXTaskManager/ABI35_0_0EXTaskManager.h>
#endif

@implementation ABI35_0_0EXScopedModuleRegistryAdapter

- (ABI35_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices
{
  ABI35_0_0UMModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<ABI35_0_0EXConstants/ABI35_0_0EXConstantsService.h>)
  ABI35_0_0EXConstantsBinding *constantsBinding = [[ABI35_0_0EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<ABI35_0_0EXFileSystem/ABI35_0_0EXFileSystem.h>)
  ABI35_0_0EXScopedFileSystemModule *fileSystemModule = [[ABI35_0_0EXScopedFileSystemModule alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];
#endif

#if __has_include(<ABI35_0_0EXFont/ABI35_0_0EXFontLoader.h>)
  ABI35_0_0EXScopedFontLoader *fontModule = [[ABI35_0_0EXScopedFontLoader alloc] init];
  [moduleRegistry registerExportedModule:fontModule];
#endif

#if __has_include(<ABI35_0_0EXSensors/ABI35_0_0EXSensorsManager.h>)
  ABI35_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI35_0_0EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
#endif

  ABI35_0_0EXScopedReactNativeAdapter *ReactABI35_0_0NativeAdapter = [[ABI35_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ReactABI35_0_0NativeAdapter];

  ABI35_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI35_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<ABI35_0_0EXFileSystem/ABI35_0_0EXFilePermissionModule.h>)
  ABI35_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI35_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];
#endif

#if __has_include(<ABI35_0_0EXSecureStore/ABI35_0_0EXSecureStore.h>)
  ABI35_0_0EXScopedSecureStore *secureStoreModule = [[ABI35_0_0EXScopedSecureStore alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<ABI35_0_0EXAmplitude/ABI35_0_0EXAmplitude.h>)
  ABI35_0_0EXScopedAmplitude *amplitudeModule = [[ABI35_0_0EXScopedAmplitude alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:amplitudeModule];
#endif

#if __has_include(<ABI35_0_0EXPermissions/ABI35_0_0EXPermissions.h>)
  ABI35_0_0EXScopedPermissions *permissionsModule = [[ABI35_0_0EXScopedPermissions alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<ABI35_0_0EXSegment/ABI35_0_0EXSegment.h>)
  ABI35_0_0EXScopedSegment *segmentModule = [[ABI35_0_0EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<ABI35_0_0EXBranch/RNBranch.h>)
  ABI35_0_0EXScopedBranch *branchModule = [[ABI35_0_0EXScopedBranch alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:branchModule];
#endif

#if __has_include(<ABI35_0_0EXLocalAuthentication/ABI35_0_0EXLocalAuthentication.h>)
  ABI35_0_0EXScopedLocalAuthentication *localAuthenticationModule = [[ABI35_0_0EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<ABI35_0_0EXTaskManager/ABI35_0_0EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare ReactABI35_0_0 Native
  ABI35_0_0EXTaskManager *taskManagerModule = [[ABI35_0_0EXTaskManager alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif

  return moduleRegistry;
}

- (NSArray<id<ABI35_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry
{
  return [[super extraModulesForModuleRegistry:moduleRegistry] arrayByAddingObject:[[ABI35_0_0EXModuleRegistryBinding alloc] initWithModuleRegistry:moduleRegistry]];
}

@end
