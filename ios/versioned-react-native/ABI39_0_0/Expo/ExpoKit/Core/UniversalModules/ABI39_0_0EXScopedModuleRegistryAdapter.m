// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI39_0_0EXScopedModuleRegistry.h"

#import "ABI39_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI39_0_0EXSensorsManagerBinding.h"
#import "ABI39_0_0EXConstantsBinding.h"
#import "ABI39_0_0EXScopedFileSystemModule.h"
#import "ABI39_0_0EXUnversioned.h"
#import "ABI39_0_0EXScopedFilePermissionModule.h"
#import "ABI39_0_0EXScopedFontLoader.h"
#import "ABI39_0_0EXScopedSecureStore.h"
#import "ABI39_0_0EXScopedAmplitude.h"
#import "ABI39_0_0EXScopedPermissions.h"
#import "ABI39_0_0EXScopedSegment.h"
#import "ABI39_0_0EXScopedLocalAuthentication.h"
#import "ABI39_0_0EXScopedBranch.h"
#import "ABI39_0_0EXScopedErrorRecoveryModule.h"
#import "ABI39_0_0EXScopedFacebook.h"
#import "ABI39_0_0EXScopedFirebaseCore.h"
#import "ABI39_0_0EXUpdatesBinding.h"

#import "ABI39_0_0EXScopedReactNativeAdapter.h"
#import "ABI39_0_0EXExpoUserNotificationCenterProxy.h"

#import "ABI39_0_0EXScopedNotificationsEmitter.h"
#import "ABI39_0_0EXScopedNotificationsHandlerModule.h"
#import "ABI39_0_0EXScopedNotificationBuilder.h"
#import "ABI39_0_0EXScopedNotificationSchedulerModule.h"
#import "ABI39_0_0EXScopedNotificationPresentationModule.h"
#import "ABI39_0_0EXScopedNotificationCategoriesModule.h"

#if __has_include(<ABI39_0_0EXTaskManager/ABI39_0_0EXTaskManager.h>)
#import <ABI39_0_0EXTaskManager/ABI39_0_0EXTaskManager.h>
#endif

@implementation ABI39_0_0EXScopedModuleRegistryAdapter

- (ABI39_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices
{
  ABI39_0_0UMModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<ABI39_0_0EXUpdates/ABI39_0_0EXUpdatesService.h>)
  ABI39_0_0EXUpdatesBinding *updatesBinding = [[ABI39_0_0EXUpdatesBinding alloc] initWithExperienceId:experienceId updatesKernelService:kernelServices[@"EXUpdatesManager"] databaseKernelService:kernelServices[@"EXUpdatesDatabaseManager"]];
  [moduleRegistry registerInternalModule:updatesBinding];
#endif

#if __has_include(<ABI39_0_0EXConstants/ABI39_0_0EXConstantsService.h>)
  ABI39_0_0EXConstantsBinding *constantsBinding = [[ABI39_0_0EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params deviceInstallationUUIDManager:kernelServices[@"EXDeviceInstallationUUIDService"]];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<ABI39_0_0EXFacebook/ABI39_0_0EXFacebook.h>)
  // only override in Expo client
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI39_0_0EXScopedFacebook *scopedFacebook = [[ABI39_0_0EXScopedFacebook alloc] initWithExperienceId:experienceId andParams:params];
    [moduleRegistry registerExportedModule:scopedFacebook];
  }
#endif

#if __has_include(<ABI39_0_0EXFileSystem/ABI39_0_0EXFileSystem.h>)
  ABI39_0_0EXScopedFileSystemModule *fileSystemModule;
  if (params[@"fileSystemDirectories"]) {
    NSString *documentDirectory = params[@"fileSystemDirectories"][@"documentDirectory"];
    NSString *cachesDirectory = params[@"fileSystemDirectories"][@"cachesDirectory"];
    fileSystemModule = [[ABI39_0_0EXScopedFileSystemModule alloc] initWithDocumentDirectory:documentDirectory
                                                                   cachesDirectory:cachesDirectory
                                                                   bundleDirectory:nil];
  } else {
    fileSystemModule = [ABI39_0_0EXScopedFileSystemModule new];
  }
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];
#endif

#if __has_include(<ABI39_0_0EXFont/ABI39_0_0EXFontLoader.h>)
  ABI39_0_0EXScopedFontLoader *fontModule = [[ABI39_0_0EXScopedFontLoader alloc] init];
  [moduleRegistry registerExportedModule:fontModule];
#endif

#if __has_include(<ABI39_0_0EXSensors/ABI39_0_0EXSensorsManager.h>)
  ABI39_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI39_0_0EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
#endif

  ABI39_0_0EXScopedReactNativeAdapter *ABI39_0_0ReactNativeAdapter = [[ABI39_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ABI39_0_0ReactNativeAdapter];

  ABI39_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI39_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<ABI39_0_0EXFileSystem/ABI39_0_0EXFilePermissionModule.h>)
  ABI39_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI39_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];
#endif

#if __has_include(<ABI39_0_0EXSecureStore/ABI39_0_0EXSecureStore.h>)
  ABI39_0_0EXScopedSecureStore *secureStoreModule = [[ABI39_0_0EXScopedSecureStore alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<ABI39_0_0EXAmplitude/ABI39_0_0EXAmplitude.h>)
  ABI39_0_0EXScopedAmplitude *amplitudeModule = [[ABI39_0_0EXScopedAmplitude alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:amplitudeModule];
#endif

#if __has_include(<ABI39_0_0EXPermissions/ABI39_0_0EXPermissions.h>)
  ABI39_0_0EXScopedPermissions *permissionsModule = [[ABI39_0_0EXScopedPermissions alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<ABI39_0_0EXSegment/ABI39_0_0EXSegment.h>)
  ABI39_0_0EXScopedSegment *segmentModule = [[ABI39_0_0EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<ABI39_0_0EXBranch/ABI39_0_0RNBranch.h>)
  ABI39_0_0EXScopedBranch *branchModule = [[ABI39_0_0EXScopedBranch alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:branchModule];
#endif

#if __has_include(<ABI39_0_0EXLocalAuthentication/ABI39_0_0EXLocalAuthentication.h>)
  ABI39_0_0EXScopedLocalAuthentication *localAuthenticationModule = [[ABI39_0_0EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<ABI39_0_0EXTaskManager/ABI39_0_0EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare ABI39_0_0React Native
  ABI39_0_0EXTaskManager *taskManagerModule = [[ABI39_0_0EXTaskManager alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif
  
#if __has_include(<ABI39_0_0EXErrorRecovery/ABI39_0_0EXErrorRecoveryModule.h>)
  ABI39_0_0EXScopedErrorRecoveryModule *errorRecovery = [[ABI39_0_0EXScopedErrorRecoveryModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:errorRecovery];
#endif
  
#if __has_include(<ABI39_0_0EXFirebaseCore/ABI39_0_0EXFirebaseCore.h>)
  ABI39_0_0EXScopedFirebaseCore *firebaseCoreModule = [[ABI39_0_0EXScopedFirebaseCore alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:firebaseCoreModule];
  [moduleRegistry registerInternalModule:firebaseCoreModule];
#endif

#if __has_include(<ABI39_0_0EXNotifications/ABI39_0_0EXNotificationsEmitter.h>)
  ABI39_0_0EXScopedNotificationsEmitter *notificationsEmmitter = [[ABI39_0_0EXScopedNotificationsEmitter alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationsEmmitter];
#endif
  
#if __has_include(<ABI39_0_0EXNotifications/ABI39_0_0EXNotificationsHandlerModule.h>)
  ABI39_0_0EXScopedNotificationsHandlerModule *notificationsHandler = [[ABI39_0_0EXScopedNotificationsHandlerModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationsHandler];
#endif
  
#if __has_include(<ABI39_0_0EXNotifications/ABI39_0_0EXNotificationsHandlerModule.h>)
  ABI39_0_0EXScopedNotificationBuilder *notificationsBuilder = [[ABI39_0_0EXScopedNotificationBuilder alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:notificationsBuilder];
#endif
  
#if __has_include(<ABI39_0_0EXNotifications/ABI39_0_0EXNotificationSchedulerModule.h>)
  ABI39_0_0EXScopedNotificationSchedulerModule *schedulerModule = [[ABI39_0_0EXScopedNotificationSchedulerModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:schedulerModule];
#endif
    
#if __has_include(<ABI39_0_0EXNotifications/ABI39_0_0EXNotificationPresentationModule.h>)
  ABI39_0_0EXScopedNotificationPresentationModule *notificationPresentationModule = [[ABI39_0_0EXScopedNotificationPresentationModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationPresentationModule];
#endif
  
#if __has_include(<ABI39_0_0EXNotifications/ABI39_0_0EXNotificationCategoriesModule.h>)
  ABI39_0_0EXScopedNotificationCategoriesModule *categoriesModule = [[ABI39_0_0EXScopedNotificationCategoriesModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:categoriesModule];
#endif
  return moduleRegistry;
}

@end
