// Copyright 2020-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesService.h>
#import <ExpoModulesCore/EXUtilities.h>

#if __has_include(<EXUpdates/EXUpdates-Swift.h>)
#import <EXUpdates/EXUpdates-Swift.h>
#else
#import "EXUpdates-Swift.h"
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 * Internal module whose purpose is to connect EXUpdatesModule with the central updates entry point.
 * In most apps, this is EXUpdatesAppController.
 *
 * In other cases, this module can be overridden at runtime to redirect EXUpdatesModule to a
 * different entry point. This is the case in Expo Go, where this module is overridden by
 * EXUpdatesBinding in order to get data from EXAppLoaderExpoUpdates.
 */
@implementation EXUpdatesService

EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
#if SUPPRESS_EXPO_UPDATES_SERVICE // used in Expo Go
  return @[];
#endif
  return @[@protocol(EXUpdatesModuleInterface)];
}

- (nullable EXUpdatesConfig *)config
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

- (nullable EXUpdatesSelectionPolicy *)selectionPolicy
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

- (BOOL)isEmbeddedLaunch
{
  // True if the embedded update and its ID are not nil, and match
  // the ID of the launched update
  return [[self embeddedUpdate] updateId] != nil &&
  [[[self embeddedUpdate] updateId] isEqual:[[self launchedUpdate] updateId]];
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

- (BOOL)canCheckForUpdateAndFetchUpdate
{
  return YES;
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
