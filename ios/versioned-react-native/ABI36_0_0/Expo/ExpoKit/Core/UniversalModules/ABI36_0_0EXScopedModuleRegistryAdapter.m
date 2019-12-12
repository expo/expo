// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI36_0_0EXScopedModuleRegistry.h"

#import "ABI36_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI36_0_0EXSensorsManagerBinding.h"
#import "ABI36_0_0EXConstantsBinding.h"
#import "ABI36_0_0EXScopedFileSystemModule.h"
#import "ABI36_0_0EXUnversioned.h"
#import "ABI36_0_0EXScopedFilePermissionModule.h"
#import "ABI36_0_0EXScopedFontLoader.h"
#import "ABI36_0_0EXScopedSecureStore.h"
#import "ABI36_0_0EXScopedAmplitude.h"
#import "ABI36_0_0EXScopedPermissions.h"
#import "ABI36_0_0EXScopedSegment.h"
#import "ABI36_0_0EXScopedLocalAuthentication.h"
#import "ABI36_0_0EXScopedBranch.h"
#import "ABI36_0_0EXScopedErrorRecoveryModule.h"
#import "ABI36_0_0EXScopedFacebook.h"

#import "ABI36_0_0EXScopedReactNativeAdapter.h"
#import "ABI36_0_0EXModuleRegistryBinding.h"
#import "ABI36_0_0EXExpoUserNotificationCenterProxy.h"

#if __has_include(<ABI36_0_0EXTaskManager/ABI36_0_0EXTaskManager.h>)
#import <ABI36_0_0EXTaskManager/ABI36_0_0EXTaskManager.h>
#endif

@implementation ABI36_0_0EXScopedModuleRegistryAdapter

- (ABI36_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices
{
  ABI36_0_0UMModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<ABI36_0_0EXConstants/ABI36_0_0EXConstantsService.h>)
  ABI36_0_0EXConstantsBinding *constantsBinding = [[ABI36_0_0EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<ABI36_0_0EXFacebook/ABI36_0_0EXFacebook.h>)
  // only override in Expo client
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI36_0_0EXScopedFacebook *scopedFacebook = [[ABI36_0_0EXScopedFacebook alloc] initWithExperienceId:experienceId andParams:params];
    [moduleRegistry registerExportedModule:scopedFacebook];
  }
#endif

#if __has_include(<ABI36_0_0EXFileSystem/ABI36_0_0EXFileSystem.h>)
  ABI36_0_0EXScopedFileSystemModule *fileSystemModule = [[ABI36_0_0EXScopedFileSystemModule alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];
#endif

#if __has_include(<ABI36_0_0EXFont/ABI36_0_0EXFontLoader.h>)
  ABI36_0_0EXScopedFontLoader *fontModule = [[ABI36_0_0EXScopedFontLoader alloc] init];
  [moduleRegistry registerExportedModule:fontModule];
#endif

#if __has_include(<ABI36_0_0EXSensors/ABI36_0_0EXSensorsManager.h>)
  ABI36_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI36_0_0EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
#endif

  ABI36_0_0EXScopedReactNativeAdapter *ABI36_0_0ReactNativeAdapter = [[ABI36_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ABI36_0_0ReactNativeAdapter];

  ABI36_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI36_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<ABI36_0_0EXFileSystem/ABI36_0_0EXFilePermissionModule.h>)
  ABI36_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI36_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];
#endif

#if __has_include(<ABI36_0_0EXSecureStore/ABI36_0_0EXSecureStore.h>)
  ABI36_0_0EXScopedSecureStore *secureStoreModule = [[ABI36_0_0EXScopedSecureStore alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<ABI36_0_0EXAmplitude/ABI36_0_0EXAmplitude.h>)
  ABI36_0_0EXScopedAmplitude *amplitudeModule = [[ABI36_0_0EXScopedAmplitude alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:amplitudeModule];
#endif

#if __has_include(<ABI36_0_0EXPermissions/ABI36_0_0EXPermissions.h>)
  ABI36_0_0EXScopedPermissions *permissionsModule = [[ABI36_0_0EXScopedPermissions alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<ABI36_0_0EXSegment/ABI36_0_0EXSegment.h>)
  ABI36_0_0EXScopedSegment *segmentModule = [[ABI36_0_0EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<ABI36_0_0EXBranch/ABI36_0_0RNBranch.h>)
  ABI36_0_0EXScopedBranch *branchModule = [[ABI36_0_0EXScopedBranch alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:branchModule];
#endif

#if __has_include(<ABI36_0_0EXLocalAuthentication/ABI36_0_0EXLocalAuthentication.h>)
  ABI36_0_0EXScopedLocalAuthentication *localAuthenticationModule = [[ABI36_0_0EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<ABI36_0_0EXTaskManager/ABI36_0_0EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare ABI36_0_0React Native
  ABI36_0_0EXTaskManager *taskManagerModule = [[ABI36_0_0EXTaskManager alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif

#if __has_include(<ABI36_0_0EXErrorRecovery/ABI36_0_0EXErrorRecoveryModule.h>)
  ABI36_0_0EXScopedErrorRecoveryModule *errorRecovery = [[ABI36_0_0EXScopedErrorRecoveryModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:errorRecovery];
#endif
  
  return moduleRegistry;
}

- (NSArray<id<ABI36_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI36_0_0UMModuleRegistry *)moduleRegistry
{
  return [[super extraModulesForModuleRegistry:moduleRegistry] arrayByAddingObject:[[ABI36_0_0EXModuleRegistryBinding alloc] initWithModuleRegistry:moduleRegistry]];
}

@end
