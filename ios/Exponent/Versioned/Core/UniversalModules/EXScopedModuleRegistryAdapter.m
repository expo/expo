// Copyright © 2018 650 Industries. All rights reserved.

#import "EXScopedModuleRegistry.h"

#import "EXScopedModuleRegistryAdapter.h"
#import "EXSensorsManagerBinding.h"
#import "EXConstantsBinding.h"
#import "EXScopedFileSystemModule.h"
#import "EXUnversioned.h"
#import "EXScopedFilePermissionModule.h"
#import "EXScopedFontLoader.h"
#import "EXScopedSecureStore.h"
#import "EXScopedAmplitude.h"
#import "EXScopedPermissions.h"
#import "EXScopedSegment.h"
#import "EXScopedLocalAuthentication.h"
#import "EXScopedBranch.h"
#import "EXScopedErrorRecoveryModule.h"
#import "EXScopedFacebook.h"
#import "EXScopedFirebaseCore.h"
#import "EXUpdatesBinding.h"

#import "EXScopedReactNativeAdapter.h"
#import "EXExpoUserNotificationCenterProxy.h"

#import "EXScopedNotificationsEmitter.h"
#import "EXScopedNotificationsHandlerModule.h"
#import "EXScopedNotificationBuilder.h"
#import "EXScopedNotificationSchedulerModule.h"
#import "EXScopedNotificationPresentationModule.h"
#import "EXScopedNotificationCategoriesModule.h"
#import "EXScopedServerRegistrationModule.h"

#if __has_include(<EXTaskManager/EXTaskManager.h>)
#import <EXTaskManager/EXTaskManager.h>
#endif

@implementation EXScopedModuleRegistryAdapter

- (UMModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params forExperienceId:(NSString *)experienceId withKernelServices:(NSDictionary *)kernelServices
{
  UMModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<EXUpdates/EXUpdatesService.h>)
  EXUpdatesBinding *updatesBinding = [[EXUpdatesBinding alloc] initWithExperienceId:experienceId updatesKernelService:kernelServices[EX_UNVERSIONED(@"EXUpdatesManager")] databaseKernelService:kernelServices[EX_UNVERSIONED(@"EXUpdatesDatabaseManager")]];
  [moduleRegistry registerInternalModule:updatesBinding];
#endif

#if __has_include(<EXConstants/EXConstantsService.h>)
  EXConstantsBinding *constantsBinding = [[EXConstantsBinding alloc] initWithExperienceId:experienceId andParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<EXFacebook/EXFacebook.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    EXScopedFacebook *scopedFacebook = [[EXScopedFacebook alloc] initWithExperienceId:experienceId andParams:params];
    [moduleRegistry registerExportedModule:scopedFacebook];
  }
#endif

#if __has_include(<EXFileSystem/EXFileSystem.h>)
  EXScopedFileSystemModule *fileSystemModule;
  if (params[@"fileSystemDirectories"]) {
    NSString *documentDirectory = params[@"fileSystemDirectories"][@"documentDirectory"];
    NSString *cachesDirectory = params[@"fileSystemDirectories"][@"cachesDirectory"];
    fileSystemModule = [[EXScopedFileSystemModule alloc] initWithDocumentDirectory:documentDirectory
                                                                   cachesDirectory:cachesDirectory
                                                                   bundleDirectory:nil];
  } else {
    fileSystemModule = [EXScopedFileSystemModule new];
  }
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];
#endif

#if __has_include(<EXFont/EXFontLoader.h>)
  EXScopedFontLoader *fontModule = [[EXScopedFontLoader alloc] init];
  [moduleRegistry registerExportedModule:fontModule];
#endif

#if __has_include(<EXSensors/EXSensorsManager.h>)
  EXSensorsManagerBinding *sensorsManagerBinding = [[EXSensorsManagerBinding alloc] initWithExperienceId:experienceId andKernelService:kernelServices[EX_UNVERSIONED(@"EXSensorManager")]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
#endif

  EXScopedReactNativeAdapter *reactNativeAdapter = [[EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:reactNativeAdapter];

  EXExpoUserNotificationCenterProxy *userNotificationCenter = [[EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[EX_UNVERSIONED(@"EXUserNotificationCenter")]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<EXFileSystem/EXFilePermissionModule.h>)
  EXScopedFilePermissionModule *filePermissionModule = [[EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];
#endif

#if __has_include(<EXSecureStore/EXSecureStore.h>)
  EXScopedSecureStore *secureStoreModule = [[EXScopedSecureStore alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<EXAmplitude/EXAmplitude.h>)
  EXScopedAmplitude *amplitudeModule = [[EXScopedAmplitude alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:amplitudeModule];
#endif

#if __has_include(<EXPermissions/EXPermissions.h>)
  EXScopedPermissions *permissionsModule = [[EXScopedPermissions alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<EXSegment/EXSegment.h>)
  EXScopedSegment *segmentModule = [[EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<EXBranch/RNBranch.h>)
  EXScopedBranch *branchModule = [[EXScopedBranch alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:branchModule];
#endif

#if __has_include(<EXLocalAuthentication/EXLocalAuthentication.h>)
  EXScopedLocalAuthentication *localAuthenticationModule = [[EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<EXTaskManager/EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare React Native
  EXTaskManager *taskManagerModule = [[EXTaskManager alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif
  
#if __has_include(<EXErrorRecovery/EXErrorRecoveryModule.h>)
  EXScopedErrorRecoveryModule *errorRecovery = [[EXScopedErrorRecoveryModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:errorRecovery];
#endif
  
#if __has_include(<EXFirebaseCore/EXFirebaseCore.h>)
  EXScopedFirebaseCore *firebaseCoreModule = [[EXScopedFirebaseCore alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:firebaseCoreModule];
  [moduleRegistry registerInternalModule:firebaseCoreModule];
#endif

#if __has_include(<EXNotifications/EXNotificationsEmitter.h>)
  EXScopedNotificationsEmitter *notificationsEmmitter = [[EXScopedNotificationsEmitter alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationsEmmitter];
#endif
  
#if __has_include(<EXNotifications/EXNotificationsHandlerModule.h>)
  EXScopedNotificationsHandlerModule *notificationsHandler = [[EXScopedNotificationsHandlerModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationsHandler];
#endif
  
#if __has_include(<EXNotifications/EXNotificationsHandlerModule.h>)
  EXScopedNotificationBuilder *notificationsBuilder = [[EXScopedNotificationBuilder alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
  [moduleRegistry registerInternalModule:notificationsBuilder];
#endif
  
#if __has_include(<EXNotifications/EXNotificationSchedulerModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    EXScopedNotificationSchedulerModule *schedulerModule = [[EXScopedNotificationSchedulerModule alloc] initWithExperienceId:experienceId];
    [moduleRegistry registerExportedModule:schedulerModule];
  }
#endif
    
#if __has_include(<EXNotifications/EXNotificationPresentationModule.h>)
  EXScopedNotificationPresentationModule *notificationPresentationModule = [[EXScopedNotificationPresentationModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:notificationPresentationModule];
#endif
  
#if __has_include(<EXNotifications/EXNotificationCategoriesModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    EXScopedNotificationCategoriesModule *scopedCategoriesModule = [[EXScopedNotificationCategoriesModule alloc] initWithExperienceId:experienceId andConstantsBinding:constantsBinding];
    [moduleRegistry registerExportedModule:scopedCategoriesModule];
  }
  [EXScopedNotificationCategoriesModule maybeMigrateLegacyCategoryIdentifiersForProject:experienceId
                                                                             isInExpoGo:[params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]];
#endif
  
#if __has_include(<EXNotifications/EXServerRegistrationModule.h>)
  EXScopedServerRegistrationModule *serverRegistrationModule = [[EXScopedServerRegistrationModule alloc] initWithExperienceId:experienceId];
  [moduleRegistry registerExportedModule:serverRegistrationModule];
#endif

  return moduleRegistry;
}

@end
