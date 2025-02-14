// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactNativeFactoryDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface DevClientAppDelegate : EXReactNativeFactoryDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge;

@end

NS_ASSUME_NONNULL_END
