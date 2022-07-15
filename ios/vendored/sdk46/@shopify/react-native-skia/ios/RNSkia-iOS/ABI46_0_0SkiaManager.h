#pragma once

#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>

#import <ABI46_0_0RNSkManager.h>

@interface ABI46_0_0SkiaManager : NSObject

- (std::shared_ptr<ABI46_0_0RNSkia::ABI46_0_0RNSkManager>)skManager;

- (instancetype)init NS_UNAVAILABLE;

- (void)invalidate;

- (instancetype)initWithBridge:(ABI46_0_0RCTBridge *)bridge;

@end
