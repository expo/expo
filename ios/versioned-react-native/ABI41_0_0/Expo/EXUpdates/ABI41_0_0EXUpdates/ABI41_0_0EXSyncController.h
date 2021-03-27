//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncLoader.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncLoaderTask.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncConfig.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncDatabase.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncEmbeddedLoader.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncSelectionPolicy.h>
#import <ABI41_0_0EXUpdates/ABI41_0_0EXSyncService.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI41_0_0EXSyncController;

@protocol ABI41_0_0EXSyncControllerDelegate <NSObject>

- (void)appController:(ABI41_0_0EXSyncController *)appController didStartWithSuccess:(BOOL)success;

@end

@interface ABI41_0_0EXSyncController : NSObject <ABI41_0_0EXSyncLoaderTaskDelegate>

/**
 Delegate which will be notified when ABI41_0_0EXUpdates has an update ready to launch and
 `launchAssetUrl` is nonnull.
 */
@property (nonatomic, weak) id<ABI41_0_0EXSyncControllerDelegate> delegate;

/**
 The ABI41_0_0RCTBridge for which ABI41_0_0EXUpdates is providing the JS bundle and assets.
 This is optional, but required in order for `Updates.reload()` and Updates module events to work.
 */
@property (nonatomic, weak) ABI41_0_0RCTBridge *bridge;

/**
 The URL on disk to source asset for the ABI41_0_0RCTBridge.
 Will be null until the ABI41_0_0EXSyncController delegate method is called.
 This should be provided in the `sourceURLForBridge:` method of ABI41_0_0RCTBridgeDelegate.
 */
@property (nullable, nonatomic, readonly, strong) NSURL *launchAssetUrl;
/**
 A dictionary of the locally downloaded assets for the current update. Keys are the remote URLs
 of the assets and values are local paths. This should be exported by the Updates JS module and
 can be used by `expo-asset` or a similar module to override ABI41_0_0React Native's asset resolution and
 use the locally downloaded assets.
 */
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;

/**
 for internal use in ABI41_0_0EXUpdates
 */
@property (nonatomic, readonly) ABI41_0_0EXSyncConfig *config;
@property (nonatomic, readonly) ABI41_0_0EXSyncDatabase *database;
@property (nonatomic, readonly) id<ABI41_0_0EXSyncSelectionPolicy> selectionPolicy;
@property (nonatomic, readonly) NSURL *updatesDirectory;
@property (nonatomic, readonly) dispatch_queue_t assetFilesQueue;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nullable, nonatomic, readonly, strong) ABI41_0_0EXSyncManifest *launchedUpdate;

+ (instancetype)sharedInstance;

/**
 Overrides the configuration values specified in Expo.plist with the ones provided in this
 dictionary. This method can be used if any of these values should be determined at runtime
 instead of buildtime. If used, this method must be called before any other method on the
 shared instance of ABI41_0_0EXSyncController.
 */
- (void)setConfiguration:(NSDictionary *)configuration;

/**
 Starts the update process to launch a previously-loaded update and (if configured to do so)
 check for a new update from the server. This method should be called as early as possible in
 the application's lifecycle.

 Note that iOS may stop showing the app's splash screen in case the update is taking a while
 to load. If your splash screen setup is simple, you may want to use the
 `startAndShowLaunchScreen:` method instead.
 */
- (void)start;

/**
 Starts the update process to launch a previously-loaded update and (if configured to do so)
 check for a new update from the server. This method should be called as early as possible in
 the application's lifecycle.

 Note that iOS may stop showing the app's splash screen in case the update is taking a while
 to load. This method will attempt to find `LaunchScreen.xib` and load it into view while the
 update is loading.
 */
- (void)startAndShowLaunchScreen:(UIWindow *)window;

- (void)requestRelaunchWithCompletion:(ABI41_0_0EXSyncRelaunchCompletionBlock)completion;

@end

NS_ASSUME_NONNULL_END
