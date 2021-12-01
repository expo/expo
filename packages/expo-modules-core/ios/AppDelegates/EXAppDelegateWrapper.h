// Copyright 2018-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ExpoModulesCore/EXReactDelegateWrapper.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Provides backwards compatibility for existing projects with `AppDelegate`
 written in Objective-C and that forwards all messages to the new `ExpoAppDelegate`.
 If your `AppDelegate` is in Swift, it should inherit from `ExpoAppDelegate` class instead.
 */
@interface EXAppDelegateWrapper : UIResponder <UIApplicationDelegate>

@property (nonatomic, strong, readonly) EXReactDelegateWrapper *reactDelegate;

@end

NS_ASSUME_NONNULL_END
