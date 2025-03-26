// Copyright 2015-present 650 Industries. All rights reserved.

#import <React_RCTAppDelegate/React-RCTAppDelegate-umbrella.h>

NS_ASSUME_NONNULL_BEGIN

@interface DevClientReactNativeFactoryDelegate : RCTDefaultReactNativeFactoryDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge;

@end

NS_ASSUME_NONNULL_END
