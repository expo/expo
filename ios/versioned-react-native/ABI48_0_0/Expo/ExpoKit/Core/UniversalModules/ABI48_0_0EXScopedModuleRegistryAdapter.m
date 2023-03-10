// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI48_0_0EXScopedModuleRegistry.h"

#import "ABI48_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI48_0_0EXSensorsManagerBinding.h"
#import "ABI48_0_0EXConstantsBinding.h"
#import "ABI48_0_0EXScopedFileSystemModule.h"
#import "ABI48_0_0EXUnversioned.h"
#import "ABI48_0_0EXScopedFilePermissionModule.h"
#import "ABI48_0_0EXScopedFontLoader.h"
#import "ABI48_0_0EXScopedSecureStore.h"
#import "ABI48_0_0EXScopedAmplitude.h"
#import "ABI48_0_0EXScopedPermissions.h"
#import "ABI48_0_0EXScopedSegment.h"
#import "ABI48_0_0EXScopedLocalAuthentication.h"
#import "ABI48_0_0EXScopedBranch.h"
#import "ABI48_0_0EXScopedErrorRecoveryModule.h"
#import "ABI48_0_0EXScopedFacebook.h"
#import "ABI48_0_0EXScopedFirebaseCore.h"
#import "ABI48_0_0EXUpdatesBinding.h"

#import "ABI48_0_0EXScopedReactNativeAdapter.h"
#import "ABI48_0_0EXExpoUserNotificationCenterProxy.h"

#import "ABI48_0_0EXScopedNotificationsEmitter.h"
#import "ABI48_0_0EXScopedNotificationsHandlerModule.h"
#import "ABI48_0_0EXScopedNotificationBuilder.h"
#import "ABI48_0_0EXScopedNotificationSchedulerModule.h"
#import "ABI48_0_0EXScopedNotificationPresentationModule.h"
#import "ABI48_0_0EXScopedNotificationCategoriesModule.h"
#import "ABI48_0_0EXScopedServerRegistrationModule.h"

#if __has_include(<ABI48_0_0EXTaskManager/ABI48_0_0EXTaskManager.h>)
#import <ABI48_0_0EXTaskManager/ABI48_0_0EXTaskManager.h>
#endif

@implementation ABI48_0_0EXScopedModuleRegistryAdapter

- (ABI48_0_0EXModuleRegistry *)moduleRegistryForParams:(NSDictionary *)params
                  forExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                     scopeKey:(NSString *)scopeKey
                                     manifest:(ABI48_0_0EXManifestsManifest *)manifest
                           withKernelServices:(NSDictionary *)kernelServices
{
  ABI48_0_0EXModuleRegistry *moduleRegistry = [self.moduleRegistryProvider moduleRegistry];

#if __has_include(<ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesService.h>)
  ABI48_0_0EXUpdatesBinding *updatesBinding = [[ABI48_0_0EXUpdatesBinding alloc] initWithScopeKey:scopeKey
                                                                     updatesKernelService:kernelServices[@"EXUpdatesManager"]
                                                                    databaseKernelService:kernelServices[@"EXUpdatesDatabaseManager"]];
  [moduleRegistry registerInternalModule:updatesBinding];
#endif

#if __has_include(<ABI48_0_0EXConstants/ABI48_0_0EXConstantsService.h>)
  ABI48_0_0EXConstantsBinding *constantsBinding = [[ABI48_0_0EXConstantsBinding alloc] initWithParams:params];
  [moduleRegistry registerInternalModule:constantsBinding];
#endif

#if __has_include(<ABI48_0_0EXFacebook/ABI48_0_0EXFacebook.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI48_0_0EXScopedFacebook *scopedFacebook = [[ABI48_0_0EXScopedFacebook alloc] initWithScopeKey:scopeKey manifest:manifest];
    [moduleRegistry registerExportedModule:scopedFacebook];
  }
#endif

#if __has_include(<ABI48_0_0EXFileSystem/ABI48_0_0EXFileSystem.h>)
  ABI48_0_0EXScopedFileSystemModule *fileSystemModule;
  if (params[@"fileSystemDirectories"]) {
    NSString *documentDirectory = params[@"fileSystemDirectories"][@"documentDirectory"];
    NSString *cachesDirectory = params[@"fileSystemDirectories"][@"cachesDirectory"];
    fileSystemModule = [[ABI48_0_0EXScopedFileSystemModule alloc] initWithDocumentDirectory:documentDirectory
                                                                   cachesDirectory:cachesDirectory
                                                                   bundleDirectory:nil];
  } else {
    fileSystemModule = [ABI48_0_0EXScopedFileSystemModule new];
  }
  [moduleRegistry registerExportedModule:fileSystemModule];
  [moduleRegistry registerInternalModule:fileSystemModule];
#endif

#if __has_include(<ABI48_0_0EXFont/ABI48_0_0EXFontLoader.h>)
  ABI48_0_0EXScopedFontLoader *fontModule = [[ABI48_0_0EXScopedFontLoader alloc] init];
  [moduleRegistry registerExportedModule:fontModule];
#endif

#if __has_include(<ABI48_0_0EXSensors/ABI48_0_0EXSensorsManager.h>)
  ABI48_0_0EXSensorsManagerBinding *sensorsManagerBinding = [[ABI48_0_0EXSensorsManagerBinding alloc] initWithScopeKey:scopeKey andKernelService:kernelServices[@"EXSensorManager"]];
  [moduleRegistry registerInternalModule:sensorsManagerBinding];
#endif

  ABI48_0_0EXScopedReactNativeAdapter *ABI48_0_0ReactNativeAdapter = [[ABI48_0_0EXScopedReactNativeAdapter alloc] init];
  [moduleRegistry registerInternalModule:ABI48_0_0ReactNativeAdapter];

  ABI48_0_0EXExpoUserNotificationCenterProxy *userNotificationCenter = [[ABI48_0_0EXExpoUserNotificationCenterProxy alloc] initWithUserNotificationCenter:kernelServices[@"EXUserNotificationCenter"]];
  [moduleRegistry registerInternalModule:userNotificationCenter];

#if __has_include(<ABI48_0_0EXFileSystem/ABI48_0_0EXFilePermissionModule.h>)
  ABI48_0_0EXScopedFilePermissionModule *filePermissionModule = [[ABI48_0_0EXScopedFilePermissionModule alloc] init];
  [moduleRegistry registerInternalModule:filePermissionModule];
#endif

#if __has_include(<ABI48_0_0EXSecureStore/ABI48_0_0EXSecureStore.h>)
  ABI48_0_0EXScopedSecureStore *secureStoreModule = [[ABI48_0_0EXScopedSecureStore alloc] initWithScopeKey:scopeKey andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:secureStoreModule];
#endif

#if __has_include(<ABI48_0_0EXAmplitude/ABI48_0_0EXAmplitude.h>)
  ABI48_0_0EXScopedAmplitude *amplitudeModule = [[ABI48_0_0EXScopedAmplitude alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerExportedModule:amplitudeModule];
#endif

#if __has_include(<ABI48_0_0ExpoModulesCore/ABI48_0_0EXPermissionsService.h>)
  ABI48_0_0EXScopedPermissions *permissionsModule = [[ABI48_0_0EXScopedPermissions alloc] initWithScopeKey:scopeKey andConstantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:permissionsModule];
  [moduleRegistry registerInternalModule:permissionsModule];
#endif

#if __has_include(<ABI48_0_0EXSegment/ABI48_0_0EXSegment.h>)
  ABI48_0_0EXScopedSegment *segmentModule = [[ABI48_0_0EXScopedSegment alloc] init];
  [moduleRegistry registerExportedModule:segmentModule];
#endif

#if __has_include(<ABI48_0_0EXBranch/ABI48_0_0RNBranch.h>)
  ABI48_0_0EXScopedBranch *branchModule = [[ABI48_0_0EXScopedBranch alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerInternalModule:branchModule];
#endif

#if __has_include(<ABI48_0_0EXLocalAuthentication/ABI48_0_0EXLocalAuthentication.h>)
  ABI48_0_0EXScopedLocalAuthentication *localAuthenticationModule = [[ABI48_0_0EXScopedLocalAuthentication alloc] init];
  [moduleRegistry registerExportedModule:localAuthenticationModule];
#endif

#if __has_include(<ABI48_0_0EXTaskManager/ABI48_0_0EXTaskManager.h>)
  // TODO: Make scoped task manager when adding support for bare ABI48_0_0React Native
  ABI48_0_0EXTaskManager *taskManagerModule = [[ABI48_0_0EXTaskManager alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerInternalModule:taskManagerModule];
  [moduleRegistry registerExportedModule:taskManagerModule];
#endif

#if __has_include(<ABI48_0_0EXErrorRecovery/ABI48_0_0EXErrorRecoveryModule.h>)
  ABI48_0_0EXScopedErrorRecoveryModule *errorRecovery = [[ABI48_0_0EXScopedErrorRecoveryModule alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerExportedModule:errorRecovery];
#endif

#if __has_include(<ABI48_0_0EXFirebaseCore/ABI48_0_0EXFirebaseCore.h>)
  ABI48_0_0EXScopedFirebaseCore *firebaseCoreModule = [[ABI48_0_0EXScopedFirebaseCore alloc] initWithScopeKey:scopeKey manifest:manifest constantsBinding:constantsBinding];
  [moduleRegistry registerExportedModule:firebaseCoreModule];
  [moduleRegistry registerInternalModule:firebaseCoreModule];
#endif

#if __has_include(<ABI48_0_0EXNotifications/ABI48_0_0EXNotificationsEmitter.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI48_0_0EXScopedNotificationsEmitter *notificationsEmmitter = [[ABI48_0_0EXScopedNotificationsEmitter alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationsEmmitter];
  }
#endif

#if __has_include(<ABI48_0_0EXNotifications/ABI48_0_0EXNotificationsHandlerModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI48_0_0EXScopedNotificationsHandlerModule *notificationsHandler = [[ABI48_0_0EXScopedNotificationsHandlerModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationsHandler];
  }
#endif

#if __has_include(<ABI48_0_0EXNotifications/ABI48_0_0EXNotificationsHandlerModule.h>)
  ABI48_0_0EXScopedNotificationBuilder *notificationsBuilder = [[ABI48_0_0EXScopedNotificationBuilder alloc] initWithScopeKey:scopeKey
                                                                                                  andConstantsBinding:constantsBinding];
  [moduleRegistry registerInternalModule:notificationsBuilder];
#endif

#if __has_include(<ABI48_0_0EXNotifications/ABI48_0_0EXNotificationSchedulerModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI48_0_0EXScopedNotificationSchedulerModule *schedulerModule = [[ABI48_0_0EXScopedNotificationSchedulerModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:schedulerModule];
  }
#endif

#if __has_include(<ABI48_0_0EXNotifications/ABI48_0_0EXNotificationPresentationModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI48_0_0EXScopedNotificationPresentationModule *notificationPresentationModule = [[ABI48_0_0EXScopedNotificationPresentationModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:notificationPresentationModule];
  }
#endif

#if __has_include(<ABI48_0_0EXNotifications/ABI48_0_0EXNotificationCategoriesModule.h>)
  // only override in Expo Go
  if ([params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]) {
    ABI48_0_0EXScopedNotificationCategoriesModule *scopedCategoriesModule = [[ABI48_0_0EXScopedNotificationCategoriesModule alloc] initWithScopeKey:scopeKey];
    [moduleRegistry registerExportedModule:scopedCategoriesModule];
  }
  [ABI48_0_0EXScopedNotificationCategoriesModule maybeMigrateLegacyCategoryIdentifiersForProjectWithExperienceStableLegacyId:experienceStableLegacyId
                                                                                                 scopeKey:scopeKey
                                                                                                         isInExpoGo:[params[@"constants"][@"appOwnership"] isEqualToString:@"expo"]];
#endif

#if __has_include(<ABI48_0_0EXNotifications/ABI48_0_0EXServerRegistrationModule.h>)
  ABI48_0_0EXScopedServerRegistrationModule *serverRegistrationModule = [[ABI48_0_0EXScopedServerRegistrationModule alloc] initWithScopeKey:scopeKey];
  [moduleRegistry registerExportedModule:serverRegistrationModule];
#endif

  return moduleRegistry;
}

@end
