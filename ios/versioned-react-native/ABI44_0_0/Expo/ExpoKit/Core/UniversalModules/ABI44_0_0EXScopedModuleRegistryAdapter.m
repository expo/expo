// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI44_0_0EXScopedModuleRegistry.h"

#import "ABI44_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI44_0_0EXSensorsManagerBinding.h"
#import "ABI44_0_0EXConstantsBinding.h"
#import "ABI44_0_0EXScopedFileSystemModule.h"
#import "ABI44_0_0EXUnversioned.h"
#import "ABI44_0_0EXScopedFilePermissionModule.h"
#import "ABI44_0_0EXScopedFontLoader.h"
#import "ABI44_0_0EXScopedSecureStore.h"
#import "ABI44_0_0EXScopedAmplitude.h"
#import "ABI44_0_0EXScopedPermissions.h"
#import "ABI44_0_0EXScopedSegment.h"
#import "ABI44_0_0EXScopedLocalAuthentication.h"
#import "ABI44_0_0EXScopedBranch.h"
#import "ABI44_0_0EXScopedErrorRecoveryModule.h"
#import "ABI44_0_0EXScopedFacebook.h"
#import "ABI44_0_0EXScopedFirebaseCore.h"
#import "ABI44_0_0EXUpdatesBinding.h"

#import "ABI44_0_0EXScopedReactNativeAdapter.h"
#import "ABI44_0_0EXExpoUserNotificationCenterProxy.h"

#import "ABI44_0_0EXScopedNotificationsEmitter.h"
#import "ABI44_0_0EXScopedNotificationsHandlerModule.h"
#import "ABI44_0_0EXScopedNotificationBuilder.h"
#import "ABI44_0_0EXScopedNotificationSchedulerModule.h"
#import "ABI44_0_0EXScopedNotificationPresentationModule.h"
#import "ABI44_0_0EXScopedNotificationCategoriesModule.h"
#import "ABI44_0_0EXScopedServerRegistrationModule.h"

#if __has_include(<ABI44_0_0EXTaskManager/ABI44_0_0EXTaskManager.h>)
#import <ABI44_0_0EXTaskManager/ABI44_0_0EXTaskManager.h>
#endif

@implementation ABI44_0_0EXScopedModuleRegistryAdapter

- (ABI44_0_0EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(ABI44_0_0EXManifestsManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices
{
  ABI44_0_0EXModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<ABI44_0_0EXUpdates/ABI44_0_0EXUpdatesService.h>)
  ABI44_0_0EXUpdatesBinding *updatesBinding = [[ABI44_0_0EXUpdatesBinding alloc] initWithScopeKey:scopeKey
                                                                     updatesKernelService:kernelServices[@"EXUpdatesManager"]
                                                                    databaseKernelService:kernelServices[@"EXUpdatesDatabaseManager"]];
  [moduleRegistry registerInternalModule:updatesBinding];
#endif

#if __has_include(<ABI44_0_0EXConstants/ABI44_0_0EXConstantsService.h>)
  ABI44_0_0EXConstantsBinding *constantsBinding = [[ABI44_0_0EXConstantsBinding alloc] initWithParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<ABI44_0_0EXFacebook/ABI44_0_0EXFacebook.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI44_0_0EXScopedFacebook *scopedFacebook = [[ABI44_0_0EXScopedFacebook alloc] initWithScopeKey:scopeKey manifest:manifest];
    [moduleRegistry registerExportedModule:scopedFacebook];
  }
#endif

#if __has_include(<ABI44_0_0EXFileSystem/ABI44_0_0EXFileSystem.h>)
  ABI44_0_0EXScopedFileSystemModule *fileSystemModule;
  if (params[@"fileSystemDirectories"]) {
    NSString *documentDirectory = params[@"fileSystemDirectories"][@"documentDirectory"];
    NSString *cachesDirectory = params[@"fileSystemDirectories"][@"cachesDirectory"];
    fileSystemModule = [[ABI44_0_0EXScopedFileSystemModule alloc] initWithDocumentDirectory:documentDirectory
                                                                   cachesDirectory:cachesDirectory
                                                                   bundleDirectory:nil];
  } else {
    fileSystemModule = [ABI44_0_0EXScopedFileSystemModule new];
  }
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];
#endif

#if __has_include(<ABI44_0_0EXFont/ABI44_0_0EXFontLoader.h>)
  ABI44_0_0EXScopedFontLoader *fontModule = [[ABI44_0_0EXScopedFontLoader alloc] init];
  [moduleRegistry registerExportedModule:fontModule];
#endif

#if __has_include(<ABI44_0_0EXSensors/ABI44_0_0EXSensorsManager.h>)
  ABI44_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI44_0_0EXSensorsManagerBinding alloc] initWithScopeKey:scopeKey andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
#endif

  ABI44_0_0EXScopedReactNativeAdapter *ABI44_0_0ReactNativeAdapter = [[ABI44_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ABI44_0_0ReactNativeAdapter];

  ABI44_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI44_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<ABI44_0_0EXFileSystem/ABI44_0_0EXFilePermissionModule.h>)
  ABI44_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI44_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];
#endif

#if __has_include(<ABI44_0_0EXSecureStore/ABI44_0_0EXSecureStore.h>)
  ABI44_0_0EXScopedSecureStore *secureStoreModule = [[ABI44_0_0EXScopedSecureStore alloc] initWithScopeKey:scopeKey andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<ABI44_0_0EXAmplitude/ABI44_0_0EXAmplitude.h>)
  ABI44_0_0EXScopedAmplitude *amplitudeModule = [[ABI44_0_0EXScopedAmplitude alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerExportedModule:amplitudeModule];
#endif

#if __has_include(<ABI44_0_0ExpoModulesCore/ABI44_0_0EXPermissionsService.h>)
  ABI44_0_0EXScopedPermissions *permissionsModule = [[ABI44_0_0EXScopedPermissions alloc] initWithScopeKey:scopeKey andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<ABI44_0_0EXSegment/ABI44_0_0EXSegment.h>)
  ABI44_0_0EXScopedSegment *segmentModule = [[ABI44_0_0EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<ABI44_0_0EXBranch/ABI44_0_0RNBranch.h>)
  ABI44_0_0EXScopedBranch *branchModule = [[ABI44_0_0EXScopedBranch alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerInternalModule:branchModule];
#endif

#if __has_include(<ABI44_0_0EXLocalAuthentication/ABI44_0_0EXLocalAuthentication.h>)
  ABI44_0_0EXScopedLocalAuthentication *localAuthenticationModule = [[ABI44_0_0EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<ABI44_0_0EXTaskManager/ABI44_0_0EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare ABI44_0_0React Native
  ABI44_0_0EXTaskManager *taskManagerModule = [[ABI44_0_0EXTaskManager alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif

#if __has_include(<ABI44_0_0EXErrorRecovery/ABI44_0_0EXErrorRecoveryModule.h>)
  ABI44_0_0EXScopedErrorRecoveryModule *errorRecovery = [[ABI44_0_0EXScopedErrorRecoveryModule alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerExportedModule:errorRecovery];
#endif

#if __has_include(<ABI44_0_0EXFirebaseCore/ABI44_0_0EXFirebaseCore.h>)
  ABI44_0_0EXScopedFirebaseCore *firebaseCoreModule = [[ABI44_0_0EXScopedFirebaseCore alloc] initWithScopeKey:scopeKey manifest:manifest constantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:firebaseCoreModule];
  [moduleRegistry registerInternalModule:firebaseCoreModule];
#endif

#if __has_include(<ABI44_0_0EXNotifications/ABI44_0_0EXNotificationsEmitter.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI44_0_0EXScopedNotificationsEmitter *notificationsEmmitter = [[ABI44_0_0EXScopedNotificationsEmitter alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationsEmmitter];
  }
#endif

#if __has_include(<ABI44_0_0EXNotifications/ABI44_0_0EXNotificationsHandlerModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI44_0_0EXScopedNotificationsHandlerModule *notificationsHandler = [[ABI44_0_0EXScopedNotificationsHandlerModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationsHandler];
  }
#endif

#if __has_include(<ABI44_0_0EXNotifications/ABI44_0_0EXNotificationsHandlerModule.h>)
  ABI44_0_0EXScopedNotificationBuilder *notificationsBuilder = [[ABI44_0_0EXScopedNotificationBuilder alloc] initWithScopeKey:scopeKey
                                                                                                  andConstantsBinding:constantsBinding];
  [moduleRegistry registerInternalModule:notificationsBuilder];
#endif

#if __has_include(<ABI44_0_0EXNotifications/ABI44_0_0EXNotificationSchedulerModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI44_0_0EXScopedNotificationSchedulerModule *schedulerModule = [[ABI44_0_0EXScopedNotificationSchedulerModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:schedulerModule];
  }
#endif

#if __has_include(<ABI44_0_0EXNotifications/ABI44_0_0EXNotificationPresentationModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI44_0_0EXScopedNotificationPresentationModule *notificationPresentationModule = [[ABI44_0_0EXScopedNotificationPresentationModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationPresentationModule];
  }
#endif

#if __has_include(<ABI44_0_0EXNotifications/ABI44_0_0EXNotificationCategoriesModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI44_0_0EXScopedNotificationCategoriesModule *scopedCategoriesModule = [[ABI44_0_0EXScopedNotificationCategoriesModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:scopedCategoriesModule];
  }
  [ABI44_0_0EXScopedNotificationCategoriesModule maybeMigrateLegacyCategoryIdentifiersForProjectWithExperienceStableLegacyId:experienceStableLegacyId
                                                                                                 scopeKey:scopeKey
                                                                                                         isInExpoGo:[params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]];
#endif

#if __has_include(<ABI44_0_0EXNotifications/ABI44_0_0EXServerRegistrationModule.h>)
  ABI44_0_0EXScopedServerRegistrationModule *serverRegistrationModule = [[ABI44_0_0EXScopedServerRegistrationModule alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerExportedModule:serverRegistrationModule];
#endif

  return moduleRegistry;
}

@end
