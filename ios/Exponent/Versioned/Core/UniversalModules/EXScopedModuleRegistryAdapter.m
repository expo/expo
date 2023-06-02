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

- (EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(EXManifestsManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices
{
  EXModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<EXUpdates/EXUpdatesService.h>)
  EXUpdatesBinding *updatesBinding = [[EXUpdatesBinding alloc] initWithScopeKey:scopeKey
                                                                     updatesKernelService:kernelServices[EX_UNVERSIONED(@"EXUpdatesManager")]
                                                                    databaseKernelService:kernelServices[EX_UNVERSIONED(@"EXUpdatesDatabaseManager")]];
  [moduleRegistry registerInternalModule:updatesBinding];
#endif

#if __has_include(<EXConstants/EXConstantsService.h>)
  EXConstantsBinding *constantsBinding = [[EXConstantsBinding alloc] initWithParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<EXFacebook/EXFacebook.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    EXScopedFacebook *scopedFacebook = [[EXScopedFacebook alloc] initWithScopeKey:scopeKey manifest:manifest];
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
  EXSensorsManagerBinding *sensorsManagerBinding = [[EXSensorsManagerBinding alloc] initWithScopeKey:scopeKey andKernelService:kernelServices[EX_UNVERSIONED(@"EXSensorManager")]];
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
  EXScopedSecureStore *secureStoreModule = [[EXScopedSecureStore alloc] initWithScopeKey:scopeKey andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<ExpoModulesCore/EXPermissionsService.h>)
  EXScopedPermissions *permissionsModule = [[EXScopedPermissions alloc] initWithScopeKey:scopeKey andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<EXSegment/EXSegment.h>)
  EXScopedSegment *segmentModule = [[EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<EXBranch/RNBranch.h>)
  EXScopedBranch *branchModule = [[EXScopedBranch alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerInternalModule:branchModule];
#endif

#if __has_include(<EXLocalAuthentication/EXLocalAuthentication.h>)
  EXScopedLocalAuthentication *localAuthenticationModule = [[EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<EXTaskManager/EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare React Native
  EXTaskManager *taskManagerModule = [[EXTaskManager alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif

#if __has_include(<EXErrorRecovery/EXErrorRecoveryModule.h>)
  EXScopedErrorRecoveryModule *errorRecovery = [[EXScopedErrorRecoveryModule alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerExportedModule:errorRecovery];
#endif

#if __has_include(<EXFirebaseCore/EXFirebaseCore.h>)
  EXScopedFirebaseCore *firebaseCoreModule = [[EXScopedFirebaseCore alloc] initWithScopeKey:scopeKey manifest:manifest constantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:firebaseCoreModule];
  [moduleRegistry registerInternalModule:firebaseCoreModule];
#endif

#if __has_include(<EXNotifications/EXNotificationsEmitter.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    EXScopedNotificationsEmitter *notificationsEmmitter = [[EXScopedNotificationsEmitter alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationsEmmitter];
  }
#endif

#if __has_include(<EXNotifications/EXNotificationsHandlerModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    EXScopedNotificationsHandlerModule *notificationsHandler = [[EXScopedNotificationsHandlerModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationsHandler];
  }
#endif

#if __has_include(<EXNotifications/EXNotificationsHandlerModule.h>)
  EXScopedNotificationBuilder *notificationsBuilder = [[EXScopedNotificationBuilder alloc] initWithScopeKey:scopeKey
                                                                                                  andConstantsBinding:constantsBinding];
  [moduleRegistry registerInternalModule:notificationsBuilder];
#endif

#if __has_include(<EXNotifications/EXNotificationSchedulerModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    EXScopedNotificationSchedulerModule *schedulerModule = [[EXScopedNotificationSchedulerModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:schedulerModule];
  }
#endif

#if __has_include(<EXNotifications/EXNotificationPresentationModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    EXScopedNotificationPresentationModule *notificationPresentationModule = [[EXScopedNotificationPresentationModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationPresentationModule];
  }
#endif

#if __has_include(<EXNotifications/EXNotificationCategoriesModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    EXScopedNotificationCategoriesModule *scopedCategoriesModule = [[EXScopedNotificationCategoriesModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:scopedCategoriesModule];
  }
  [EXScopedNotificationCategoriesModule maybeMigrateLegacyCategoryIdentifiersForProjectWithExperienceStableLegacyId:experienceStableLegacyId
                                                                                                 scopeKey:scopeKey
                                                                                                         isInExpoGo:[params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]];
#endif

#if __has_include(<EXNotifications/EXServerRegistrationModule.h>)
  EXScopedServerRegistrationModule *serverRegistrationModule = [[EXScopedServerRegistrationModule alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerExportedModule:serverRegistrationModule];
#endif

  return moduleRegistry;
}

@end
