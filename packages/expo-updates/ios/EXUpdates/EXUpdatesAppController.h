//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppLoader.h>
#import <EXUpdates/EXUpdatesAppLoaderTask.h>
#import <EXUpdates/EXUpdatesConfig.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesEmbeddedAppLoader.h>
#import <EXUpdates/EXUpdatesSelectionPolicy.h>
#import <EXUpdates/EXUpdatesService.h>
#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

@class EXUpdatesAppController;

@protocol EXUpdatesAppControllerDelegate <NSObject>

- (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success;

@end

@interface EXUpdatesAppController : NSObject <EXUpdatesAppLoaderTaskDelegate>

/**
 Delegate which will be notified when EXUpdates has an update ready to launch and
 `launchAssetUrl` is nonnull.
 */
@property (nonatomic, weak) id<EXUpdatesAppControllerDelegate> delegate;

/**
 The RCTBridge for which EXUpdates is providing the JS bundle and assets.
 This is optional, but required in order for `Updates.reload()` and Updates module events to work.
 */
@property (nonatomic, weak) RCTBridge *bridge;

/**
 The URL on disk to source asset for the RCTBridge.
 Will be null until the EXUpdatesAppController delegate method is called.
 This should be provided in the `sourceURLForBridge:` method of RCTBridgeDelegate.
 */
@property (nullable, nonatomic, readonly, strong) NSURL *launchAssetUrl;
/**
 A dictionary of the locally downloaded assets for the current update. Keys are the remote URLs
 of the assets and values are local paths. This should be exported by the Updates JS module and
 can be used by `expo-asset` or a similar module to override React Native's asset resolution and
 use the locally downloaded assets.
 */
@property (nullable, nonatomic, readonly, strong) NSDictionary *assetFilesMap;
@property (nonatomic, readonly, assign) BOOL isUsingEmbeddedAssets;

/**
 for internal use in EXUpdates
 */
@property (nonatomic, readonly) EXUpdatesConfig *config;
@property (nonatomic, readonly) EXUpdatesDatabase *database;
@property (nonatomic, readonly) EXUpdatesSelectionPolicy *selectionPolicy;
@property (nonatomic, readonly) NSURL *updatesDirectory;
@property (nonatomic, readonly) dispatch_queue_t assetFilesQueue;
@property (nonatomic, readonly, assign) BOOL isStarted;
@property (nonatomic, readonly, assign) BOOL isEmergencyLaunch;
@property (nullable, nonatomic, readonly, strong) EXUpdatesUpdate *launchedUpdate;

+ (instancetype)sharedInstance;

/**
 Overrides the configuration values specified in Expo.plist with the ones provided in this
 dictionary. This method can be used if any of these values should be determined at runtime
 instead of buildtime. If used, this method must be called before any other method on the
 shared instance of EXUpdatesAppController.
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
- (void)setNextSelectionPolicy:(EXUpdatesSelectionPolicy *)nextSelectionPolicy;

/**
 * Similar to the above method, but sets the next selection policy to whatever
 * EXUpdatesAppController's default selection policy is.
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

- (void)requestRelaunchWithCompletion:(EXUpdatesAppRelaunchCompletionBlock)completion;

@end

NS_ASSUME_NONNULL_END
