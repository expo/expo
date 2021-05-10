// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI40_0_0EXScopedModuleRegistry.h"

#import "ABI40_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI40_0_0EXSensorsManagerBinding.h"
#import "ABI40_0_0EXConstantsBinding.h"
#import "ABI40_0_0EXScopedFileSystemModule.h"
#import "ABI40_0_0EXUnversioned.h"
#import "ABI40_0_0EXScopedFilePermissionModule.h"
#import "ABI40_0_0EXScopedFontLoader.h"
#import "ABI40_0_0EXScopedSecureStore.h"
#import "ABI40_0_0EXScopedAmplitude.h"
#import "ABI40_0_0EXScopedPermissions.h"
#import "ABI40_0_0EXScopedSegment.h"
#import "ABI40_0_0EXScopedLocalAuthentication.h"
#import "ABI40_0_0EXScopedBranch.h"
#import "ABI40_0_0EXScopedErrorRecoveryModule.h"
#import "ABI40_0_0EXScopedFacebook.h"
#import "ABI40_0_0EXScopedFirebaseCore.h"
#import "ABI40_0_0EXUpdatesBinding.h"

#import "ABI40_0_0EXScopedReactNativeAdapter.h"
#import "ABI40_0_0EXExpoUserNotificationCenterProxy.h"

#import "ABI40_0_0EXScopedNotificationsEmitter.h"
#import "ABI40_0_0EXScopedNotificationsHandlerModule.h"
#import "ABI40_0_0EXScopedNotificationBuilder.h"
#import "ABI40_0_0EXScopedNotificationSchedulerModule.h"
#import "ABI40_0_0EXScopedNotificationPresentationModule.h"
#import "ABI40_0_0EXScopedNotificationCategoriesModule.h"
#import "ABI40_0_0EXScopedServerRegistrationModule.h"

#if __has_include(<ABI40_0_0EXTaskManager/ABI40_0_0EXTaskManager.h>)
#import <ABI40_0_0EXTaskManager/ABI40_0_0EXTaskManager.h>
#endif

@implementation ABI40_0_0EXScopedModuleRegistryAdapter

- (ABI40_0_0UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices
{
  ABI40_0_0UMModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<ABI40_0_0EXUpdates/ABI40_0_0EXUpdatesService.h>)
  ABI40_0_0EXUpdatesBinding *updatesBinding = [[ABI40_0_0EXUpdatesBinding alloc] initWithExperienceId:experienceId updatesKernelService:kernelServices[@"EXUpdatesManager"] databaseKernelService:kernelServices[@"EXUpdatesDatabaseManager"]];
  [moduleRegistry registerInternalModule:updatesBinding];
#endif

#if __has_include(<ABI40_0_0EXConstants/ABI40_0_0EXConstantsService.h>)
  ABI40_0_0EXConstantsBinding *constantsBinding = [[ABI40_0_0EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<ABI40_0_0EXFacebook/ABI40_0_0EXFacebook.h>)
  // only override in Expo client
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI40_0_0EXScopedFacebook *scopedFacebook = [[ABI40_0_0EXScopedFacebook alloc] initWithExperienceId:experienceId andParams:params];
    [moduleRegistry registerExportedModule:scopedFacebook];
  }
#endif

#if __has_include(<ABI40_0_0EXFileSystem/ABI40_0_0EXFileSystem.h>)
  ABI40_0_0EXScopedFileSystemModule *fileSystemModule;
  if (params[@"fileSystemDirectories"]) {
    NSString *documentDirectory = params[@"fileSystemDirectories"][@"documentDirectory"];
    NSString *cachesDirectory = params[@"fileSystemDirectories"][@"cachesDirectory"];
    fileSystemModule = [[ABI40_0_0EXScopedFileSystemModule alloc] initWithDocumentDirectory:documentDirectory
                                                                   cachesDirectory:cachesDirectory
                                                                   bundleDirectory:nil];
  } else {
    fileSystemModule = [ABI40_0_0EXScopedFileSystemModule new];
  }
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];
#endif

#if __has_include(<ABI40_0_0EXFont/ABI40_0_0EXFontLoader.h>)
  ABI40_0_0EXScopedFontLoader *fontModule = [[ABI40_0_0EXScopedFontLoader alloc] init];
  [moduleRegistry registerExportedModule:fontModule];
#endif

#if __has_include(<ABI40_0_0EXSensors/ABI40_0_0EXSensorsManager.h>)
  ABI40_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI40_0_0EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
#endif

  ABI40_0_0EXScopedReactNativeAdapter *ABI40_0_0ReactNativeAdapter = [[ABI40_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ABI40_0_0ReactNativeAdapter];

  ABI40_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI40_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<ABI40_0_0EXFileSystem/ABI40_0_0EXFilePermissionModule.h>)
  ABI40_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI40_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];
#endif

#if __has_include(<ABI40_0_0EXSecureStore/ABI40_0_0EXSecureStore.h>)
  ABI40_0_0EXScopedSecureStore *secureStoreModule = [[ABI40_0_0EXScopedSecureStore alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<ABI40_0_0EXAmplitude/ABI40_0_0EXAmplitude.h>)
  ABI40_0_0EXScopedAmplitude *amplitudeModule = [[ABI40_0_0EXScopedAmplitude alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:amplitudeModule];
#endif

#if __has_include(<ABI40_0_0EXPermissions/ABI40_0_0EXPermissions.h>)
  ABI40_0_0EXScopedPermissions *permissionsModule = [[ABI40_0_0EXScopedPermissions alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<ABI40_0_0EXSegment/ABI40_0_0EXSegment.h>)
  ABI40_0_0EXScopedSegment *segmentModule = [[ABI40_0_0EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<ABI40_0_0EXBranch/ABI40_0_0RNBranch.h>)
  ABI40_0_0EXScopedBranch *branchModule = [[ABI40_0_0EXScopedBranch alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:branchModule];
#endif

#if __has_include(<ABI40_0_0EXLocalAuthentication/ABI40_0_0EXLocalAuthentication.h>)
  ABI40_0_0EXScopedLocalAuthentication *localAuthenticationModule = [[ABI40_0_0EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<ABI40_0_0EXTaskManager/ABI40_0_0EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare ABI40_0_0React Native
  ABI40_0_0EXTaskManager *taskManagerModule = [[ABI40_0_0EXTaskManager alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif
  
#if __has_include(<ABI40_0_0EXErrorRecovery/ABI40_0_0EXErrorRecoveryModule.h>)
  ABI40_0_0EXScopedErrorRecoveryModule *errorRecovery = [[ABI40_0_0EXScopedErrorRecoveryModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:errorRecovery];
#endif
  
#if __has_include(<ABI40_0_0EXFirebaseCore/ABI40_0_0EXFirebaseCore.h>)
  ABI40_0_0EXScopedFirebaseCore *firebaseCoreModule = [[ABI40_0_0EXScopedFirebaseCore alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:firebaseCoreModule];
  [moduleRegistry registerInternalModule:firebaseCoreModule];
#endif

#if __has_include(<ABI40_0_0EXNotifications/ABI40_0_0EXNotificationsEmitter.h>)
  ABI40_0_0EXScopedNotificationsEmitter *notificationsEmmitter = [[ABI40_0_0EXScopedNotificationsEmitter alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationsEmmitter];
#endif
  
#if __has_include(<ABI40_0_0EXNotifications/ABI40_0_0EXNotificationsHandlerModule.h>)
  ABI40_0_0EXScopedNotificationsHandlerModule *notificationsHandler = [[ABI40_0_0EXScopedNotificationsHandlerModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationsHandler];
#endif
  
#if __has_include(<ABI40_0_0EXNotifications/ABI40_0_0EXNotificationsHandlerModule.h>)
  ABI40_0_0EXScopedNotificationBuilder *notificationsBuilder = [[ABI40_0_0EXScopedNotificationBuilder alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:notificationsBuilder];
#endif
  
#if __has_include(<ABI40_0_0EXNotifications/ABI40_0_0EXNotificationSchedulerModule.h>)
  ABI40_0_0EXScopedNotificationSchedulerModule *schedulerModule = [[ABI40_0_0EXScopedNotificationSchedulerModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:schedulerModule];
#endif
    
#if __has_include(<ABI40_0_0EXNotifications/ABI40_0_0EXNotificationPresentationModule.h>)
  ABI40_0_0EXScopedNotificationPresentationModule *notificationPresentationModule = [[ABI40_0_0EXScopedNotificationPresentationModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationPresentationModule];
#endif
  
#if __has_include(<ABI40_0_0EXNotifications/ABI40_0_0EXNotificationCategoriesModule.h>)
  ABI40_0_0EXScopedNotificationCategoriesModule *categoriesModule = [[ABI40_0_0EXScopedNotificationCategoriesModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:categoriesModule];
#endif
  
#if __has_include(<ABI40_0_0EXNotifications/ABI40_0_0EXServerRegistrationModule.h>)
  ABI40_0_0EXScopedServerRegistrationModule *serverRegistrationModule = [[ABI40_0_0EXScopedServerRegistrationModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:serverRegistrationModule];
#endif

  return moduleRegistry;
}

@end
