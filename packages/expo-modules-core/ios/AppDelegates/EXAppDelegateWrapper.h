// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>

#if __cplusplus

#import <ExpoModulesCore/EXReactDelegateWrapper.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

NS_ASSUME_NONNULL_BEGIN

/**
 Provides backwards compatibility for existing projects with `AppDelegate`
 written in Objective-C and that forwards all messages to the new `ExpoAppDelegate`.
 If your `AppDelegate` is in Swift, it should inherit from `ExpoAppDelegate` class instead.
 */
#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>) || __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
@interface EXAppDelegateWrapper : RCTAppDelegate
#else
@interface EXAppDelegateWrapper : UIResponder <UIApplicationDelegate>
#endif

@property (nonatomic, strong, readonly) EXReactDelegateWrapper *reactDelegate;

@end

NS_ASSUME_NONNULL_END

#else

// Workaround the main.m build error when running with new architecture mode
// Context: https://github.com/facebook/react-native/pull/35661
@interface EXAppDelegateWrapper : UIResponder
@end

#endif
