// Copyright 2018-present 650 Industries. All rights reserved.

#if __cplusplus

#import <UIKit/UIKit.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXReactDelegateWrapper.h>

#if __has_include(<ABI49_0_0React-ABI49_0_0RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>)
#import <ABI49_0_0React-ABI49_0_0RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>
#elif __has_include(<ABI49_0_0React_RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <ABI49_0_0React_RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 Provides backwards compatibility for existing projects with `AppDelegate`
 written in Objective-C and that forwards all messages to the new `ExpoAppDelegate`.
 If your `AppDelegate` is in Swift, it should inherit from `ExpoAppDelegate` class instead.
 */
#if __has_include(<ABI49_0_0React-ABI49_0_0RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>) || __has_include(<ABI49_0_0React_RCTAppDelegate/ABI49_0_0RCTAppDelegate.h>)
@interface ABI49_0_0EXAppDelegateWrapper : ABI49_0_0RCTAppDelegate
#else
@interface ABI49_0_0EXAppDelegateWrapper : UIResponder <UIApplicationDelegate>
#endif

@property (nonatomic, strong, readonly) ABI49_0_0EXReactDelegateWrapper *reactDelegate;

@end

NS_ASSUME_NONNULL_END

#else

// Workaround the main.m build error when running with new architecture mode
// Context: https://github.com/facebook/react-native/pull/35661
@interface ABI49_0_0EXAppDelegateWrapper : UIResponder
@end

#endif
