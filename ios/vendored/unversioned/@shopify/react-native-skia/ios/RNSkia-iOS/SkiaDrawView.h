#pragma once

#import <memory>
#import <string>

#import <CoreFoundation/CoreFoundation.h>
#import <UIKit/UIKit.h>

#import <RNSkManager.h>

class RNSkDrawViewImpl;

@interface SkiaDrawView : UIView

- (instancetype)initWithManager: (RNSkia::RNSkManager*)manager;

- (std::shared_ptr<RNSkDrawViewImpl>) impl;

- (void) setDrawingMode:(std::string) mode;
- (void) setDebugMode:(bool) debugMode;
- (void) setNativeId:(size_t) nativeId;

@end
