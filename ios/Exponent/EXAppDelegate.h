// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

NS_ASSUME_NONNULL_BEGIN

@class EXRootViewController;

@interface EXAppDelegate : UIResponder <UIApplicationDelegate>

@property (strong, nonatomic, nullable) UIWindow *window;
@property (nonatomic, strong) EXRootViewController *rootViewController;

@end

NS_ASSUME_NONNULL_END
