#pragma once

#import <memory>
#import <string>

#import <CoreFoundation/CoreFoundation.h>
#import <UIKit/UIKit.h>

#import <RNSkManager.h>
#import <RNSkiOSView.h>
#import <SkiaManager.h>

#if RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#endif // RCT_NEW_ARCH_ENABLED

class RNSkiOSJsView;

@interface SkiaUIView :
#if RCT_NEW_ARCH_ENABLED
    RCTViewComponentView
#else
    UIView
#endif // RCT_NEW_ARCH_ENABLED

- (instancetype)
    initWithManager:(RNSkia::RNSkManager *)manager
            factory:(std::function<std::shared_ptr<RNSkBaseiOSView>(
                         std::shared_ptr<RNSkia::RNSkPlatformContext>)>)factory;
- (void)initCommon:(RNSkia::RNSkManager *)manager
           factory:(std::function<std::shared_ptr<RNSkBaseiOSView>(
                        std::shared_ptr<RNSkia::RNSkPlatformContext>)>)factory;
- (std::shared_ptr<RNSkBaseiOSView>)impl;
- (SkiaManager *)skiaManager;

- (void)setDrawingMode:(std::string)mode;
- (void)setDebugMode:(bool)debugMode;
- (void)setNativeId:(size_t)nativeId;

@end
