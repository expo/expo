#pragma once

#import <React/RCTBridge.h>

#import <RNSkManager.h>

@interface SkiaManager : NSObject

- (std::shared_ptr<RNSkia::RNSkManager>)skManager;

- (instancetype)init NS_UNAVAILABLE;

- (void)invalidate;

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end
