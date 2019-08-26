//
//  ABI32_0_0EXAnimationViewManager.m
//  LottieReactABI32_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//

#import "ABI32_0_0EXAnimationViewManager.h"

#import "ABI32_0_0EXContainerView.h"

// import ABI32_0_0RCTBridge.h
#if __has_include(<ReactABI32_0_0/ABI32_0_0RCTBridge.h>)
#import <ReactABI32_0_0/ABI32_0_0RCTBridge.h>
#elif __has_include("ABI32_0_0RCTBridge.h")
#import "ABI32_0_0RCTBridge.h"
#else
#import "ReactABI32_0_0/ABI32_0_0RCTBridge.h"
#endif

// import ABI32_0_0RCTUIManager.h
#if __has_include(<ReactABI32_0_0/ABI32_0_0RCTUIManager.h>)
#import <ReactABI32_0_0/ABI32_0_0RCTUIManager.h>
#elif __has_include("ABI32_0_0RCTUIManager.h")
#import "ABI32_0_0RCTUIManager.h"
#else
#import "ReactABI32_0_0/ABI32_0_0RCTUIManager.h"
#endif

#import <Lottie/Lottie.h>

@implementation ABI32_0_0EXAnimationViewManager

ABI32_0_0RCT_EXPORT_MODULE(LottieAnimationView)

- (UIView *)view
{
  return [ABI32_0_0EXContainerView new];
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"VERSION": @1,
  };
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);

ABI32_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)ReactABI32_0_0Tag
                  fromFrame:(nonnull NSNumber *) startFrame
                  toFrame:(nonnull NSNumber *) endFrame)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0EXContainerView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI32_0_0EXContainerView *lottieView = (ABI32_0_0EXContainerView *)view;
      if ([startFrame intValue] != -1 && [endFrame intValue] != -1) {
        [lottieView playFromFrame:startFrame toFrame:endFrame];
      } else {
        [lottieView play];
      }
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(reset:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0EXContainerView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI32_0_0EXContainerView *lottieView = (ABI32_0_0EXContainerView *)view;
      [lottieView reset];
    }
  }];
}

@end
