// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesAppController.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI46_0_0EXUpdates/ABI46_0_0EXUpdatesService.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI46_0_0EXUpdatesService

ABI46_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
#if SUPPRESS_EXPO_UPDATES_SERVICE // used in Expo Go
  return @[];
#endif
  return @[@protocol(ABI46_0_0EXUpdatesModuleInterface)];
}

- (ABI46_0_0EXUpdatesConfig *)config
{
#if SUPPRESS_EXPO_UPDATES_SERVICE // used in Expo Go
  return nil;
#endif
  return ABI46_0_0EXUpdatesAppController.sharedInstance.config;
}

- (ABI46_0_0EXUpdatesDatabase *)database
{
  return ABI46_0_0EXUpdatesAppController.sharedInstance.database;
}

- (ABI46_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  return ABI46_0_0EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI46_0_0EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable ABI46_0_0EXUpdatesUpdate *)embeddedUpdate
{
  return [ABI46_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:self.config database:self.database];
}

- (nullable ABI46_0_0EXUpdatesUpdate *)launchedUpdate
{
  return ABI46_0_0EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI46_0_0EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI46_0_0EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return ABI46_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI46_0_0EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI46_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI46_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [ABI46_0_0EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

- (void)resetSelectionPolicy
{
  return [ABI46_0_0EXUpdatesAppController.sharedInstance resetSelectionPolicyToDefault];
}

@end

NS_ASSUME_NONNULL_END
