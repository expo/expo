// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI45_0_0EXScopedModuleRegistry.h"

#import "ABI45_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI45_0_0EXSensorsManagerBinding.h"
#import "ABI45_0_0EXConstantsBinding.h"
#import "ABI45_0_0EXScopedFileSystemModule.h"
#import "ABI45_0_0EXUnversioned.h"
#import "ABI45_0_0EXScopedFilePermissionModule.h"
#import "ABI45_0_0EXScopedFontLoader.h"
#import "ABI45_0_0EXScopedSecureStore.h"
#import "ABI45_0_0EXScopedAmplitude.h"
#import "ABI45_0_0EXScopedPermissions.h"
#import "ABI45_0_0EXScopedSegment.h"
#import "ABI45_0_0EXScopedLocalAuthentication.h"
#import "ABI45_0_0EXScopedBranch.h"
#import "ABI45_0_0EXScopedErrorRecoveryModule.h"
#import "ABI45_0_0EXScopedFacebook.h"
#import "ABI45_0_0EXScopedFirebaseCore.h"
#import "ABI45_0_0EXUpdatesBinding.h"

#import "ABI45_0_0EXScopedReactNativeAdapter.h"
#import "ABI45_0_0EXExpoUserNotificationCenterProxy.h"

#import "ABI45_0_0EXScopedNotificationsEmitter.h"
#import "ABI45_0_0EXScopedNotificationsHandlerModule.h"
#import "ABI45_0_0EXScopedNotificationBuilder.h"
#import "ABI45_0_0EXScopedNotificationSchedulerModule.h"
#import "ABI45_0_0EXScopedNotificationPresentationModule.h"
#import "ABI45_0_0EXScopedNotificationCategoriesModule.h"
#import "ABI45_0_0EXScopedServerRegistrationModule.h"

#if __has_include(<ABI45_0_0EXTaskManager/ABI45_0_0EXTaskManager.h>)
#import <ABI45_0_0EXTaskManager/ABI45_0_0EXTaskManager.h>
#endif

@implementation ABI45_0_0EXScopedModuleRegistryAdapter

- (ABI45_0_0EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(ABI45_0_0EXManifestsManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices
{
  ABI45_0_0EXModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<ABI45_0_0EXUpdates/ABI45_0_0EXUpdatesService.h>)
  ABI45_0_0EXUpdatesBinding *updatesBinding = [[ABI45_0_0EXUpdatesBinding alloc] initWithScopeKey:scopeKey
                                                                     updatesKernelService:kernelServices[@"EXUpdatesManager"]
                                                                    databaseKernelService:kernelServices[@"EXUpdatesDatabaseManager"]];
  [moduleRegistry registerInternalModule:updatesBinding];
#endif

#if __has_include(<ABI45_0_0EXConstants/ABI45_0_0EXConstantsService.h>)
  ABI45_0_0EXConstantsBinding *constantsBinding = [[ABI45_0_0EXConstantsBinding alloc] initWithParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<ABI45_0_0EXFacebook/ABI45_0_0EXFacebook.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI45_0_0EXScopedFacebook *scopedFacebook = [[ABI45_0_0EXScopedFacebook alloc] initWithScopeKey:scopeKey manifest:manifest];
    [moduleRegistry registerExportedModule:scopedFacebook];
  }
#endif

#if __has_include(<ABI45_0_0EXFileSystem/ABI45_0_0EXFileSystem.h>)
  ABI45_0_0EXScopedFileSystemModule *fileSystemModule;
  if (params[@"fileSystemDirectories"]) {
    NSString *documentDirectory = params[@"fileSystemDirectories"][@"documentDirectory"];
    NSString *cachesDirectory = params[@"fileSystemDirectories"][@"cachesDirectory"];
    fileSystemModule = [[ABI45_0_0EXScopedFileSystemModule alloc] initWithDocumentDirectory:documentDirectory
                                                                   cachesDirectory:cachesDirectory
                                                                   bundleDirectory:nil];
  } else {
    fileSystemModule = [ABI45_0_0EXScopedFileSystemModule new];
  }
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];
#endif

#if __has_include(<ABI45_0_0EXFont/ABI45_0_0EXFontLoader.h>)
  ABI45_0_0EXScopedFontLoader *fontModule = [[ABI45_0_0EXScopedFontLoader alloc] init];
  [moduleRegistry registerExportedModule:fontModule];
#endif

#if __has_include(<ABI45_0_0EXSensors/ABI45_0_0EXSensorsManager.h>)
  ABI45_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI45_0_0EXSensorsManagerBinding alloc] initWithScopeKey:scopeKey andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
#endif

  ABI45_0_0EXScopedReactNativeAdapter *ABI45_0_0ReactNativeAdapter = [[ABI45_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ABI45_0_0ReactNativeAdapter];

  ABI45_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI45_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<ABI45_0_0EXFileSystem/ABI45_0_0EXFilePermissionModule.h>)
  ABI45_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI45_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];
#endif

#if __has_include(<ABI45_0_0EXSecureStore/ABI45_0_0EXSecureStore.h>)
  ABI45_0_0EXScopedSecureStore *secureStoreModule = [[ABI45_0_0EXScopedSecureStore alloc] initWithScopeKey:scopeKey andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<ABI45_0_0EXAmplitude/ABI45_0_0EXAmplitude.h>)
  ABI45_0_0EXScopedAmplitude *amplitudeModule = [[ABI45_0_0EXScopedAmplitude alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerExportedModule:amplitudeModule];
#endif

#if __has_include(<ABI45_0_0ExpoModulesCore/ABI45_0_0EXPermissionsService.h>)
  ABI45_0_0EXScopedPermissions *permissionsModule = [[ABI45_0_0EXScopedPermissions alloc] initWithScopeKey:scopeKey andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<ABI45_0_0EXSegment/ABI45_0_0EXSegment.h>)
  ABI45_0_0EXScopedSegment *segmentModule = [[ABI45_0_0EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<ABI45_0_0EXBranch/ABI45_0_0RNBranch.h>)
  ABI45_0_0EXScopedBranch *branchModule = [[ABI45_0_0EXScopedBranch alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerInternalModule:branchModule];
#endif

#if __has_include(<ABI45_0_0EXLocalAuthentication/ABI45_0_0EXLocalAuthentication.h>)
  ABI45_0_0EXScopedLocalAuthentication *localAuthenticationModule = [[ABI45_0_0EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<ABI45_0_0EXTaskManager/ABI45_0_0EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare ABI45_0_0React Native
  ABI45_0_0EXTaskManager *taskManagerModule = [[ABI45_0_0EXTaskManager alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif

#if __has_include(<ABI45_0_0EXErrorRecovery/ABI45_0_0EXErrorRecoveryModule.h>)
  ABI45_0_0EXScopedErrorRecoveryModule *errorRecovery = [[ABI45_0_0EXScopedErrorRecoveryModule alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerExportedModule:errorRecovery];
#endif

#if __has_include(<ABI45_0_0EXFirebaseCore/ABI45_0_0EXFirebaseCore.h>)
  ABI45_0_0EXScopedFirebaseCore *firebaseCoreModule = [[ABI45_0_0EXScopedFirebaseCore alloc] initWithScopeKey:scopeKey manifest:manifest constantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:firebaseCoreModule];
  [moduleRegistry registerInternalModule:firebaseCoreModule];
#endif

#if __has_include(<ABI45_0_0EXNotifications/ABI45_0_0EXNotificationsEmitter.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI45_0_0EXScopedNotificationsEmitter *notificationsEmmitter = [[ABI45_0_0EXScopedNotificationsEmitter alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationsEmmitter];
  }
#endif

#if __has_include(<ABI45_0_0EXNotifications/ABI45_0_0EXNotificationsHandlerModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI45_0_0EXScopedNotificationsHandlerModule *notificationsHandler = [[ABI45_0_0EXScopedNotificationsHandlerModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationsHandler];
  }
#endif

#if __has_include(<ABI45_0_0EXNotifications/ABI45_0_0EXNotificationsHandlerModule.h>)
  ABI45_0_0EXScopedNotificationBuilder *notificationsBuilder = [[ABI45_0_0EXScopedNotificationBuilder alloc] initWithScopeKey:scopeKey
                                                                                                  andConstantsBinding:constantsBinding];
  [moduleRegistry registerInternalModule:notificationsBuilder];
#endif

#if __has_include(<ABI45_0_0EXNotifications/ABI45_0_0EXNotificationSchedulerModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI45_0_0EXScopedNotificationSchedulerModule *schedulerModule = [[ABI45_0_0EXScopedNotificationSchedulerModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:schedulerModule];
  }
#endif

#if __has_include(<ABI45_0_0EXNotifications/ABI45_0_0EXNotificationPresentationModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI45_0_0EXScopedNotificationPresentationModule *notificationPresentationModule = [[ABI45_0_0EXScopedNotificationPresentationModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationPresentationModule];
  }
#endif

#if __has_include(<ABI45_0_0EXNotifications/ABI45_0_0EXNotificationCategoriesModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI45_0_0EXScopedNotificationCategoriesModule *scopedCategoriesModule = [[ABI45_0_0EXScopedNotificationCategoriesModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:scopedCategoriesModule];
  }
  [ABI45_0_0EXScopedNotificationCategoriesModule maybeMigrateLegacyCategoryIdentifiersForProjectWithExperienceStableLegacyId:experienceStableLegacyId
                                                                                                 scopeKey:scopeKey
                                                                                                         isInExpoGo:[params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]];
#endif

#if __has_include(<ABI45_0_0EXNotifications/ABI45_0_0EXServerRegistrationModule.h>)
  ABI45_0_0EXScopedServerRegistrationModule *serverRegistrationModule = [[ABI45_0_0EXScopedServerRegistrationModule alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerExportedModule:serverRegistrationModule];
#endif

  return moduleRegistry;
}

@end
