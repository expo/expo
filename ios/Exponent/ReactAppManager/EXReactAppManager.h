// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridge.h>

#import "EXCachedResource.h"

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

@class EXReactAppManager;

@protocol EXReactAppManagerDelegate <NSObject>

- (void)reactAppManagerDidInitApp:(EXReactAppManager *)appManager;
- (void)reactAppManagerDidDestroyApp:(EXReactAppManager *)appManager;

- (void)reactAppManager:(EXReactAppManager *)appManager failedToDownloadBundleWithError:(NSError *)error;
- (void)reactAppManagerStartedLoadingJavaScript:(EXReactAppManager *)appManager;
- (void)reactAppManager:(EXReactAppManager *)appManager loadedJavaScriptWithProgress:(EXLoadingProgress *)progress;
- (void)reactAppManagerFinishedLoadingJavaScript:(EXReactAppManager *)appManager;
- (void)reactAppManager:(EXReactAppManager *)appManager failedToLoadJavaScriptWithError:(NSError *)error;

@optional
- (void)reactAppManagerDidForeground:(EXReactAppManager *)appManager;
- (void)reactAppManagerDidBackground:(EXReactAppManager *)appManager;

@end

@interface EXReactAppManager : NSObject <RCTBridgeDelegate>

/**
 * Tear down and rebuild the bridge (user-facing expo menu reload)
 */
- (void)reload;

/**
 * Call reload on existing bridge (developer-facing devtools reload)
 */
- (void)reloadBridge;

/**
 * Clear any executor class on the bridge and reload. Used by Cmd+N devtool key command.
 */
- (void)disableRemoteDebugging;

- (void)toggleElementInspector;

- (void)invalidate;
- (void)showDevMenu;

/**
 *  Whether or not the managed app enables react dev tools.
 */
- (BOOL)areDevtoolsEnabled;
- (NSDictionary<NSString *, NSString *> *)devMenuItems;
- (void)selectDevMenuItemWithKey:(NSString *)key;

@property (nonatomic, assign) id<EXReactAppManagerDelegate> delegate;
@property (nonatomic, strong) UIView * __nullable reactRootView;
@property (nonatomic, strong) id __nullable reactBridge;
@property (nonatomic, readonly) NSString *experienceId;

@end

NS_ASSUME_NONNULL_END

