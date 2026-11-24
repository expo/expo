// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/Platform.h>
#import <Expo/RCTAppDelegateUmbrella.h>

NS_ASSUME_NONNULL_BEGIN

#if TARGET_OS_IOS || TARGET_OS_TV

NS_SWIFT_NAME(ExpoBundleConfiguration)
@interface EXBundleConfiguration : RCTBundleConfiguration

- (instancetype)initWithBundleURL:(NSURL *)bundleURL NS_DESIGNATED_INITIALIZER;

+ (RCTBundleConfiguration *)configurationWithBundleURL:(nullable NSURL *)bundleURL NS_SWIFT_NAME(configuration(bundleURL:));

@end

#endif

NS_ASSUME_NONNULL_END
