// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI38_0_0EXScopedModuleRegistry.h"

#import "ABI38_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI38_0_0EXSensorsManagerBinding.h"
#import "ABI38_0_0EXConstantsBinding.h"
#import "ABI38_0_0EXScopedFileSystemModule.h"
#import "ABI38_0_0EXUnversioned.h"
#import "ABI38_0_0EXScopedFilePermissionModule.h"
#import "ABI38_0_0EXScopedFontLoader.h"
#import "ABI38_0_0EXScopedSecureStore.h"
#import "ABI38_0_0EXScopedAmplitude.h"
#import "ABI38_0_0EXScopedPermissions.h"
#import "ABI38_0_0EXScopedSegment.h"
#import "ABI38_0_0EXScopedLocalAuthentication.h"
#import "ABI38_0_0EXScopedBranch.h"
#import "ABI38_0_0EXScopedErrorRecoveryModule.h"
#import "ABI38_0_0EXScopedFacebook.h"
#import "ABI38_0_0EXScopedFirebaseCore.h"

#import "ABI38_0_0EXScopedReactNativeAdapter.h"
#import "ABI38_0_0EXExpoUserNotificationCenterProxy.h"

#import "ABI38_0_0EXScopedNotificationsEmitter.h"
#import "ABI38_0_0EXScopedNotificationsHandlerModule.h"
#import "ABI38_0_0EXScopedNotificationBuilder.h"
#import "ABI38_0_0EXScopedNotificationSchedulerModule.h"
#import "ABI38_0_0EXScopedNotificationPresentationModule.h"

#if __has_include(<ABI38_0_0EXTaskManager/ABI38_0_0EXTaskManager.h>)
#import <ABI38_0_0EXTaskManager/ABI38_0_0EXTaskManager.h>
#endif

@implementation ABI38_0_0EXScopedModuleRegistryAdapter

- (ABI38_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices
{
  ABI38_0_0UMModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<ABI38_0_0EXConstants/ABI38_0_0EXConstantsService.h>)
  ABI38_0_0EXConstantsBinding *constantsBinding = [[ABI38_0_0EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params deviceInstallationUUIDManager:kernelServices[@"EXDeviceInstallationUUIDManager"]];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<ABI38_0_0EXFacebook/ABI38_0_0EXFacebook.h>)
  // only override in Expo client
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI38_0_0EXScopedFacebook *scopedFacebook = [[ABI38_0_0EXScopedFacebook alloc] initWithExperienceId:experienceId andParams:params];
    [moduleRegistry registerExportedModule:scopedFacebook];
  }
#endif

#if __has_include(<ABI38_0_0EXFileSystem/ABI38_0_0EXFileSystem.h>)
  ABI38_0_0EXScopedFileSystemModule *fileSystemModule = [[ABI38_0_0EXScopedFileSystemModule alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];
#endif

#if __has_include(<ABI38_0_0EXFont/ABI38_0_0EXFontLoader.h>)
  ABI38_0_0EXScopedFontLoader *fontModule = [[ABI38_0_0EXScopedFontLoader alloc] init];
  [moduleRegistry registerExportedModule:fontModule];
#endif

#if __has_include(<ABI38_0_0EXSensors/ABI38_0_0EXSensorsManager.h>)
  ABI38_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI38_0_0EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
#endif

  ABI38_0_0EXScopedReactNativeAdapter *ABI38_0_0ReactNativeAdapter = [[ABI38_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ABI38_0_0ReactNativeAdapter];

  ABI38_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI38_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<ABI38_0_0EXFileSystem/ABI38_0_0EXFilePermissionModule.h>)
  ABI38_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI38_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];
#endif

#if __has_include(<ABI38_0_0EXSecureStore/ABI38_0_0EXSecureStore.h>)
  ABI38_0_0EXScopedSecureStore *secureStoreModule = [[ABI38_0_0EXScopedSecureStore alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<ABI38_0_0EXAmplitude/ABI38_0_0EXAmplitude.h>)
  ABI38_0_0EXScopedAmplitude *amplitudeModule = [[ABI38_0_0EXScopedAmplitude alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:amplitudeModule];
#endif

#if __has_include(<ABI38_0_0EXPermissions/ABI38_0_0EXPermissions.h>)
  ABI38_0_0EXScopedPermissions *permissionsModule = [[ABI38_0_0EXScopedPermissions alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<ABI38_0_0EXSegment/ABI38_0_0EXSegment.h>)
  ABI38_0_0EXScopedSegment *segmentModule = [[ABI38_0_0EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<ABI38_0_0EXBranch/ABI38_0_0RNBranch.h>)
  ABI38_0_0EXScopedBranch *branchModule = [[ABI38_0_0EXScopedBranch alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:branchModule];
#endif

#if __has_include(<ABI38_0_0EXLocalAuthentication/ABI38_0_0EXLocalAuthentication.h>)
  ABI38_0_0EXScopedLocalAuthentication *localAuthenticationModule = [[ABI38_0_0EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<ABI38_0_0EXTaskManager/ABI38_0_0EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare ABI38_0_0React Native
  ABI38_0_0EXTaskManager *taskManagerModule = [[ABI38_0_0EXTaskManager alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif
  
#if __has_include(<ABI38_0_0EXErrorRecovery/ABI38_0_0EXErrorRecoveryModule.h>)
  ABI38_0_0EXScopedErrorRecoveryModule *errorRecovery = [[ABI38_0_0EXScopedErrorRecoveryModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:errorRecovery];
#endif
  
#if __has_include(<ABI38_0_0EXFirebaseCore/ABI38_0_0EXFirebaseCore.h>)
  ABI38_0_0EXScopedFirebaseCore *firebaseCoreModule = [[ABI38_0_0EXScopedFirebaseCore alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:firebaseCoreModule];
  [moduleRegistry registerInternalModule:firebaseCoreModule];
#endif

#if __has_include(<ABI38_0_0EXNotifications/ABI38_0_0EXNotificationsEmitter.h>)
  ABI38_0_0EXScopedNotificationsEmitter *notificationsEmmitter = [[ABI38_0_0EXScopedNotificationsEmitter alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationsEmmitter];
#endif
  
#if __has_include(<ABI38_0_0EXNotifications/ABI38_0_0EXNotificationsHandlerModule.h>)
  ABI38_0_0EXScopedNotificationsHandlerModule *notificationsHandler = [[ABI38_0_0EXScopedNotificationsHandlerModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationsHandler];
#endif
  
#if __has_include(<ABI38_0_0EXNotifications/ABI38_0_0EXNotificationsHandlerModule.h>)
  ABI38_0_0EXScopedNotificationBuilder *notificationsBuilder = [[ABI38_0_0EXScopedNotificationBuilder alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:notificationsBuilder];
#endif
  
#if __has_include(<ABI38_0_0EXNotifications/ABI38_0_0EXNotificationSchedulerModule.h>)
  ABI38_0_0EXScopedNotificationSchedulerModule *schedulerModule = [[ABI38_0_0EXScopedNotificationSchedulerModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:schedulerModule];
#endif
    
#if __has_include(<ABI38_0_0EXNotifications/ABI38_0_0EXNotificationPresentationModule.h>)
  ABI38_0_0EXScopedNotificationPresentationModule *notificationPresentationModule = [[ABI38_0_0EXScopedNotificationPresentationModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationPresentationModule];
#endif
  return moduleRegistry;
}

@end
