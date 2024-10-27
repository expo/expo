// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeDelegate.h>
#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface DevClientAppDelegate : RCTAppDelegate

- (void)initRootViewFactory;

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge;

@end

NS_ASSUME_NONNULL_END
