//  Copyright © 2019 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAppLoader.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesAppLoaderTask.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesConfig.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesDatabase.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesEmbeddedAppLoader.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesSelectionPolicy.h>
#import <ABI47_0_0EXUpdates/ABI47_0_0EXUpdatesService.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI47_0_0EXUpdatesAppController;

@protocol ABI47_0_0EXUpdatesAppControllerDelegate <NSObject>

- (void)appController:(ABI47_0_0EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success;

@end

@interface ABI47_0_0EXUpdatesAppController : NSObject <ABI47_0_0EXUpdatesAppLoaderTaskDelegate>

/**
 Delegate which will be notified when ABI47_0_0EXUpdates has an update ready to launch and
 `launchAssetUrl` is nonnull.
 */
@property (nonatomic, weak) id<ABI47_0_0EXUpdatesAppControllerDelegate> delegate;

/**
 The ABI47_0_0RCTBridge for which ABI47_0_0EXUpdates is providing the JS bundle and assets.
 This is optional, but required in order for `Updates.reload()` and Updates module events to work.
 */
@property (nonatomic, weak) ABI47_0_0RCTBridge *bridge;

/**
 The URL on disk to source asset for the ABI47_0_0RCTBridge.
 Will be null until the ABI47_0_0EXUpdatesAppController delegate method is called.
 This should be provided in the `sourceURLForBridge:` method of ABI47_0_0RCTBridgeDelegate.
 */
@property (nullable, nonatomic, readonly, strong) NSURL *launchAssetUrl;
/**
 A dictionary of the locally downloaded assets for the current update. Keys are the remote URLs
 of the assets and values are local paths. This should be exported by the Updates JS module and
 can be used by `expo-asset` or a similar module to override ABI47_0_0React Native's asset resolution and
 use the locally downloaded assets.
 */
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;

/**
 for internal use in ABI47_0_0EXUpdates
 */
@property (nonatomic, readonly) ABI47_0_0EXUpdatesConfig *config;
@property (nonatomic, readonly) ABI47_0_0EXUpdatesDatabase *database;
@property (nonatomic, readonly) ABI47_0_0EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readonly) NSURL *updatesDirectory;
@property (nonatomic, readonly) dispatch_queue_t assetFilesQueue;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nullable, nonatomic, readonly, strong) ABI47_0_0EXUpdatesUpdate *launchedUpdate;

+ (instancetype)sharedInstance;

/**
 Overrides the configuration values specified in Expo.plist with the ones provided in this
 dictionary. This method can be used if any of these values should be determined at runtime
 instead of buildtime. If used, this method must be called before any other method on the
 shared instance of ABI47_0_0EXUpdatesAppController.
 */
- (void)setConfiguration:(NSDictionary *)configuration;

/**
 * For external modules that want to modify the selection policy used at runtime.
 *
 * This method does not provide any guarantees about how long the provided selection policy will
 * persist; sometimes expo-updates will reset the selection policy in situations where it makes
 * sense to have explicit control (e.g. if the developer/user has programmatically fetched an
 * update, expo-updates will reset the selection policy so the new update is launched on the
 * next reload).
 */
- (void)setNextSelectionPolicy:(ABI47_0_0EXUpdatesSelectionPolicy *)nextSelectionPolicy;

/**
 * Similar to the above method, but sets the next selection policy to whatever
 * ABI47_0_0EXUpdatesAppController's default selection policy is.
 */
- (void)resetSelectionPolicyToDefault;

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

- (void)requestRelaunchWithCompletion:(ABI47_0_0EXUpdatesAppRelaunchCompletionBlock)completion;

@end

NS_ASSUME_NONNULL_END
