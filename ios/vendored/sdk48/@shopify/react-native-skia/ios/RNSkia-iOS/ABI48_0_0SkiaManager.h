#pragma once

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>

#import <ABI48_0_0RNSkManager.h>

@interface ABI48_0_0SkiaManager : NSObject

- (std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkManager>)skManager;

- (instancetype)init NS_UNAVAILABLE;

- (void)invalidate;

- (instancetype)initWithBridge:(ABI48_0_0RCTBridge *)bridge;

@end
