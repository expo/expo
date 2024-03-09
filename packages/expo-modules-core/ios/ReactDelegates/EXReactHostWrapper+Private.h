// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

#import <ExpoModulesCore/EXReactHostWrapper.h>

#import <React/RCTBridge.h>

#if RCT_NEW_ARCH_ENABLED

#import <ReactCommon/RCTHost.h>

#endif

NS_ASSUME_NONNULL_BEGIN

@interface EXReactHostWrapper(Private)

#if RCT_NEW_ARCH_ENABLED
- (instancetype)initWithRCTHost:(RCTHost *)host;
#endif

- (instancetype)initWithRCTBridge:(RCTBridge *)bridge;

@end

NS_ASSUME_NONNULL_END
