// Copyright 2020-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesService.h>
#import <ExpoModulesCore/EXUtilities.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXUpdatesService

EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
#if SUPPRESS_EXPO_UPDATES_SERVICE // used in Expo Go
  return @[];
#endif
  return @[@protocol(EXUpdatesModuleInterface)];
}

- (EXUpdatesConfig *)config
{
#if SUPPRESS_EXPO_UPDATES_SERVICE // used in Expo Go
  return nil;
#endif
  return EXUpdatesAppController.sharedInstance.config;
}

- (EXUpdatesDatabase *)database
{
  return EXUpdatesAppController.sharedInstance.database;
}

- (EXUpdatesSelectionPolicy *)selectionPolicy
{
  return EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable EXUpdatesUpdate *)embeddedUpdate
{
  return [EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:self.config database:self.database];
}

- (nullable EXUpdatesUpdate *)launchedUpdate
{
  return EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
}

- (BOOL)isStarted
{
  return EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return EXUpdatesAppController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

- (void)resetSelectionPolicy
{
  return [EXUpdatesAppController.sharedInstance resetSelectionPolicyToDefault];
}

@end

NS_ASSUME_NONNULL_END
