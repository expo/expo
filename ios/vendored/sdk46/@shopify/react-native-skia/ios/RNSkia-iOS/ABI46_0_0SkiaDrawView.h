#pragma once

#import <memory>
#import <string>

#import <CoreFoundation/CoreFoundation.h>
#import <UIKit/UIKit.h>

#import <ABI46_0_0RNSkManager.h>

class ABI46_0_0RNSkDrawViewImpl;

@interface ABI46_0_0SkiaDrawView : UIView

- (instancetype)initWithManager: (ABI46_0_0RNSkia::ABI46_0_0RNSkManager*)manager;

- (std::shared_ptr<ABI46_0_0RNSkDrawViewImpl>) impl;

- (void) setDrawingMode:(std::string) mode;
- (void) setDebugMode:(bool) debugMode;
- (void) setNativeId:(size_t) nativeId;

@end
