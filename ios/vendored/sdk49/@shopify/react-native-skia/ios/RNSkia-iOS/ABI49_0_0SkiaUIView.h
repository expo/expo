#pragma once

#import <memory>
#import <string>

#import <CoreFoundation/CoreFoundation.h>
#import <UIKit/UIKit.h>

#import <ABI49_0_0RNSkManager.h>
#import <ABI49_0_0RNSkiOSView.h>

class ABI49_0_0RNSkiOSJsView;

@interface ABI49_0_0SkiaUIView : UIView

- (instancetype)
    initWithManager:(ABI49_0_0RNSkia::ABI49_0_0RNSkManager *)manager
            factory:(std::function<std::shared_ptr<ABI49_0_0RNSkBaseiOSView>(
                         std::shared_ptr<ABI49_0_0RNSkia::ABI49_0_0RNSkPlatformContext>)>)factory;

- (std::shared_ptr<ABI49_0_0RNSkBaseiOSView>)impl;

- (void)setDrawingMode:(std::string)mode;
- (void)setDebugMode:(bool)debugMode;
- (void)setNativeId:(size_t)nativeId;

@end
