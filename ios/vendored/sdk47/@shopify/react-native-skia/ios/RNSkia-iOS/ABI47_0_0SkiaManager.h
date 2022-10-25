#pragma once

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>

#import <ABI47_0_0RNSkManager.h>

@interface ABI47_0_0SkiaManager : NSObject

- (std::shared_ptr<ABI47_0_0RNSkia::ABI47_0_0RNSkManager>)skManager;

- (instancetype)init NS_UNAVAILABLE;

- (void)invalidate;

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge;

@end
