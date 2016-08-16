// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXErrorView.h"

#import "RCTBridge.h"

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

@interface EXRootViewController : UIViewController <RCTBridgeDelegate>

- (instancetype)initWithLaunchOptions: (NSDictionary *)launchOptions;

- (void)loadReactApplication;
- (void)applicationWillEnterForeground;

- (void)showErrorWithType:(EXFatalErrorType)type error: (nullable NSError *)error;

@end

NS_ASSUME_NONNULL_END