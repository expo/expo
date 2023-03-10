#pragma once

#import <memory>
#import <string>

#import <CoreFoundation/CoreFoundation.h>
#import <UIKit/UIKit.h>

#import <ABI48_0_0RNSkManager.h>
#import <ABI48_0_0RNSkiOSView.h>

class ABI48_0_0RNSkiOSJsView;

@interface ABI48_0_0SkiaUIView : UIView

- (instancetype)
    initWithManager:(ABI48_0_0RNSkia::ABI48_0_0RNSkManager *)manager
            factory:(std::function<std::shared_ptr<ABI48_0_0RNSkBaseiOSView>(
                         std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkPlatformContext>)>)factory;

- (std::shared_ptr<ABI48_0_0RNSkBaseiOSView>)impl;

- (void)setDrawingMode:(std::string)mode;
- (void)setDebugMode:(bool)debugMode;
- (void)setNativeId:(size_t)nativeId;

@end
