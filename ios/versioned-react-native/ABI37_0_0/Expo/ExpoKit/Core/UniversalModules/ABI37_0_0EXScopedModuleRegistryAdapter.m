// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI37_0_0EXScopedModuleRegistry.h"

#import "ABI37_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI37_0_0EXSensorsManagerBinding.h"
#import "ABI37_0_0EXConstantsBinding.h"
#import "ABI37_0_0EXScopedFileSystemModule.h"
#import "ABI37_0_0EXUnversioned.h"
#import "ABI37_0_0EXScopedFilePermissionModule.h"
#import "ABI37_0_0EXScopedFontLoader.h"
#import "ABI37_0_0EXScopedSecureStore.h"
#import "ABI37_0_0EXScopedAmplitude.h"
#import "ABI37_0_0EXScopedPermissions.h"
#import "ABI37_0_0EXScopedSegment.h"
#import "ABI37_0_0EXScopedLocalAuthentication.h"
#import "ABI37_0_0EXScopedBranch.h"
#import "ABI37_0_0EXScopedErrorRecoveryModule.h"
#import "ABI37_0_0EXScopedFacebook.h"
#import "ABI37_0_0EXScopedFirebaseCore.h"

#import "ABI37_0_0EXScopedReactNativeAdapter.h"
#import "ABI37_0_0EXExpoUserNotificationCenterProxy.h"

#if __has_include(<ABI37_0_0EXTaskManager/ABI37_0_0EXTaskManager.h>)
#import <ABI37_0_0EXTaskManager/ABI37_0_0EXTaskManager.h>
#endif

@implementation ABI37_0_0EXScopedModuleRegistryAdapter

- (ABI37_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices
{
  ABI37_0_0UMModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<ABI37_0_0EXConstants/ABI37_0_0EXConstantsService.h>)
  ABI37_0_0EXConstantsBinding *constantsBinding = [[ABI37_0_0EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<ABI37_0_0EXFacebook/ABI37_0_0EXFacebook.h>)
  // only override in Expo client
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI37_0_0EXScopedFacebook *scopedFacebook = [[ABI37_0_0EXScopedFacebook alloc] initWithExperienceId:experienceId andParams:params];
    [moduleRegistry registerExportedModule:scopedFacebook];
  }
#endif

#if __has_include(<ABI37_0_0EXFileSystem/ABI37_0_0EXFileSystem.h>)
  ABI37_0_0EXScopedFileSystemModule *fileSystemModule = [[ABI37_0_0EXScopedFileSystemModule alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];
#endif

#if __has_include(<ABI37_0_0EXFont/ABI37_0_0EXFontLoader.h>)
  ABI37_0_0EXScopedFontLoader *fontModule = [[ABI37_0_0EXScopedFontLoader alloc] init];
  [moduleRegistry registerExportedModule:fontModule];
#endif

#if __has_include(<ABI37_0_0EXSensors/ABI37_0_0EXSensorsManager.h>)
  ABI37_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI37_0_0EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
#endif

  ABI37_0_0EXScopedReactNativeAdapter *ABI37_0_0ReactNativeAdapter = [[ABI37_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ABI37_0_0ReactNativeAdapter];

  ABI37_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI37_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<ABI37_0_0EXFileSystem/ABI37_0_0EXFilePermissionModule.h>)
  ABI37_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI37_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];
#endif

#if __has_include(<ABI37_0_0EXSecureStore/ABI37_0_0EXSecureStore.h>)
  ABI37_0_0EXScopedSecureStore *secureStoreModule = [[ABI37_0_0EXScopedSecureStore alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<ABI37_0_0EXAmplitude/ABI37_0_0EXAmplitude.h>)
  ABI37_0_0EXScopedAmplitude *amplitudeModule = [[ABI37_0_0EXScopedAmplitude alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:amplitudeModule];
#endif

#if __has_include(<ABI37_0_0EXPermissions/ABI37_0_0EXPermissions.h>)
  ABI37_0_0EXScopedPermissions *permissionsModule = [[ABI37_0_0EXScopedPermissions alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<ABI37_0_0EXSegment/ABI37_0_0EXSegment.h>)
  ABI37_0_0EXScopedSegment *segmentModule = [[ABI37_0_0EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<ABI37_0_0EXBranch/ABI37_0_0RNBranch.h>)
  ABI37_0_0EXScopedBranch *branchModule = [[ABI37_0_0EXScopedBranch alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:branchModule];
#endif

#if __has_include(<ABI37_0_0EXLocalAuthentication/ABI37_0_0EXLocalAuthentication.h>)
  ABI37_0_0EXScopedLocalAuthentication *localAuthenticationModule = [[ABI37_0_0EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<ABI37_0_0EXTaskManager/ABI37_0_0EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare ABI37_0_0React Native
  ABI37_0_0EXTaskManager *taskManagerModule = [[ABI37_0_0EXTaskManager alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif
  
#if __has_include(<ABI37_0_0EXErrorRecovery/ABI37_0_0EXErrorRecoveryModule.h>)
  ABI37_0_0EXScopedErrorRecoveryModule *errorRecovery = [[ABI37_0_0EXScopedErrorRecoveryModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:errorRecovery];
#endif
  
#if __has_include(<ABI37_0_0EXFirebaseCore/ABI37_0_0EXFirebaseCore.h>)
  ABI37_0_0EXScopedFirebaseCore *firebaseCoreModule = [[ABI37_0_0EXScopedFirebaseCore alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:firebaseCoreModule];
  [moduleRegistry registerInternalModule:firebaseCoreModule];
#endif

  return moduleRegistry;
}

@end
