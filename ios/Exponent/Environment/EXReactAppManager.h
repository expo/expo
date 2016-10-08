// Copyright 2015-present 650 Industries. All rights reserved.

#import "RCTBridge.h"

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

@class EXFrame;
@class EXReactAppManager;

@protocol EXReactAppManagerDelegate <NSObject>

- (BOOL)isReadyToLoad;
- (NSURL *)bundleUrl;

- (void)reactAppManagerDidInitApp:(EXReactAppManager *)appManager;
- (void)reactAppManagerDidDestroyApp:(EXReactAppManager *)appManager;

- (void)reactAppManager:(EXReactAppManager *)appManager failedToDownloadBundleWithError:(NSError *)error;
- (void)reactAppManagerStartedLoadingJavaScript:(EXReactAppManager *)appManager;
- (void)reactAppManagerFinishedLoadingJavaScript:(EXReactAppManager *)appManager;
- (void)reactAppManager:(EXReactAppManager *)appManager failedToLoadJavaScriptWithError:(NSError *)error;

@optional
- (void)reactAppManagerDidForeground:(EXReactAppManager *)appManager;
- (void)reactAppManagerDidBackground:(EXReactAppManager *)appManager;

@end

@interface EXReactAppManager : NSObject <RCTBridgeDelegate>

- (instancetype)initWithFrame:(EXFrame * _Nullable)frame isKernel:(BOOL)isKernel launchOptions:(NSDictionary * _Nullable)launchOptions;
- (void)reload;
- (void)invalidate;

@property (nonatomic, assign) id<EXReactAppManagerDelegate> delegate;
@property (nonatomic, strong) UIView * __nullable reactRootView;
@property (nonatomic, strong) id __nullable reactBridge;
@property (nonatomic, strong) NSDictionary * __nullable launchOptions;

@end

NS_ASSUME_NONNULL_END

