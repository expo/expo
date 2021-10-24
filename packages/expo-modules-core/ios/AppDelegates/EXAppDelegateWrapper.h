// Copyright 2018-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Provides backwards compatibility for existing projects with `AppDelegate` written in Objective-C
 and that already inherits from `EXAppDelegateWrapper` (prev. `EXLegacyAppDelegateWrapper`).
 If your `AppDelegate` is written in Swift, you should use `AppDelegateWrapper` class instead.
 */
@interface EXAppDelegateWrapper : UIResponder <UIApplicationDelegate>

@end

NS_ASSUME_NONNULL_END
