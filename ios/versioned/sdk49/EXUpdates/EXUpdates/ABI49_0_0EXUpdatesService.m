// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXUpdates/ABI49_0_0EXUpdatesService.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXUtilities.h>

#if __has_include(<ABI49_0_0EXUpdates/ABI49_0_0EXUpdates-Swift.h>)
#import <ABI49_0_0EXUpdates/ABI49_0_0EXUpdates-Swift.h>
#else
#import "ABI49_0_0EXUpdates-Swift.h"
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 * Internal module whose purpose is to connect ABI49_0_0EXUpdatesModule with the central updates entry point.
 * In most apps, this is ABI49_0_0EXUpdatesAppController.
 *
 * In other cases, this module can be overridden at runtime to redirect ABI49_0_0EXUpdatesModule to a
 * different entry point. This is the case in Expo Go, where this module is overridden by
 * ABI49_0_0EXUpdatesBinding in order to get data from ABI49_0_0EXAppLoaderExpoUpdates.
 */
@implementation ABI49_0_0EXUpdatesService

ABI49_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
#if SUPPRESS_EXPO_UPDATES_SERVICE // used in Expo Go
  return @[];
#endif
  return @[@protocol(ABI49_0_0EXUpdatesModuleInterface)];
}

- (nullable ABI49_0_0EXUpdatesConfig *)config
{
#if SUPPRESS_EXPO_UPDATES_SERVICE // used in Expo Go
  return nil;
#endif
  return ABI49_0_0EXUpdatesAppController.sharedInstance.config;
}

- (ABI49_0_0EXUpdatesDatabase *)database
{
  return ABI49_0_0EXUpdatesAppController.sharedInstance.database;
}

- (nullable ABI49_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  return ABI49_0_0EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI49_0_0EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable ABI49_0_0EXUpdatesUpdate *)embeddedUpdate
{
  return [ABI49_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:self.config database:self.database];
}

- (nullable ABI49_0_0EXUpdatesUpdate *)launchedUpdate
{
  return ABI49_0_0EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI49_0_0EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI49_0_0EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
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
  return ABI49_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI49_0_0EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI49_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)canCheckForUpdateAndFetchUpdate
{
  return YES;
}

- (void)requestRelaunchWithCompletion:(ABI49_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [ABI49_0_0EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

- (void)resetSelectionPolicy
{
  return [ABI49_0_0EXUpdatesAppController.sharedInstance resetSelectionPolicyToDefault];
}

@end

NS_ASSUME_NONNULL_END
