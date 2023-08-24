#pragma once

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>

#import <ABI49_0_0RNSkManager.h>

@interface ABI49_0_0SkiaManager : NSObject

- (std::shared_ptr<ABI49_0_0RNSkia::ABI49_0_0RNSkManager>)skManager;

- (instancetype)init NS_UNAVAILABLE;

- (void)invalidate;

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge;

@end
