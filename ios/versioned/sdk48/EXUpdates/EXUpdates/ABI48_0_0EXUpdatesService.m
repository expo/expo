// Copyright 2020-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesAppController.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesService.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXUtilities.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Internal module whose purpose is to connect ABI48_0_0EXUpdatesModule with the central updates entry point.
 * In most apps, this is ABI48_0_0EXUpdatesAppController.
 *
 * In other cases, this module can be overridden at runtime to redirect ABI48_0_0EXUpdatesModule to a
 * different entry point. This is the case in Expo Go, where this module is overridden by
 * ABI48_0_0EXUpdatesBinding in order to get data from ABI48_0_0EXAppLoaderExpoUpdates.
 */
@implementation ABI48_0_0EXUpdatesService

ABI48_0_0EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
#if SUPPRESS_EXPO_UPDATES_SERVICE // used in Expo Go
  return @[];
#endif
  return @[@protocol(ABI48_0_0EXUpdatesModuleInterface)];
}

- (ABI48_0_0EXUpdatesConfig *)config
{
#if SUPPRESS_EXPO_UPDATES_SERVICE // used in Expo Go
  return nil;
#endif
  return ABI48_0_0EXUpdatesAppController.sharedInstance.config;
}

- (ABI48_0_0EXUpdatesDatabase *)database
{
  return ABI48_0_0EXUpdatesAppController.sharedInstance.database;
}

- (ABI48_0_0EXUpdatesSelectionPolicy *)selectionPolicy
{
  return ABI48_0_0EXUpdatesAppController.sharedInstance.selectionPolicy;
}

- (NSURL *)directory
{
  return ABI48_0_0EXUpdatesAppController.sharedInstance.updatesDirectory;
}

- (nullable ABI48_0_0EXUpdatesUpdate *)embeddedUpdate
{
  return [ABI48_0_0EXUpdatesEmbeddedAppLoader embeddedManifestWithConfig:self.config database:self.database];
}

- (nullable ABI48_0_0EXUpdatesUpdate *)launchedUpdate
{
  return ABI48_0_0EXUpdatesAppController.sharedInstance.launchedUpdate;
}

- (nullable NSDictionary *)assetFilesMap
{
  return ABI48_0_0EXUpdatesAppController.sharedInstance.assetFilesMap;
}

- (BOOL)isUsingEmbeddedAssets
{
  return ABI48_0_0EXUpdatesAppController.sharedInstance.isUsingEmbeddedAssets;
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
  return ABI48_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (BOOL)isEmergencyLaunch
{
  return ABI48_0_0EXUpdatesAppController.sharedInstance.isEmergencyLaunch;
}

- (BOOL)canRelaunch
{
  return ABI48_0_0EXUpdatesAppController.sharedInstance.isStarted;
}

- (void)requestRelaunchWithCompletion:(ABI48_0_0EXUpdatesAppRelaunchCompletionBlock)completion
{
  return [ABI48_0_0EXUpdatesAppController.sharedInstance requestRelaunchWithCompletion:completion];
}

- (void)resetSelectionPolicy
{
  return [ABI48_0_0EXUpdatesAppController.sharedInstance resetSelectionPolicyToDefault];
}

@end

NS_ASSUME_NONNULL_END
