// Copyright 2015-present 650 Industries. All rights reserved.

#import "RCTBridge.h"

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

@class EXReactAppManager;

@protocol EXReactAppManagerDelegate <NSObject>

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

- (void)reload;
- (void)invalidate;

@property (nonatomic, assign) id<EXReactAppManagerDelegate> delegate;
@property (nonatomic, strong) UIView * __nullable reactRootView;
@property (nonatomic, strong) id __nullable reactBridge;

@end

NS_ASSUME_NONNULL_END

