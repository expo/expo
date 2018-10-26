//
//  ABI31_0_0EXAnimationViewManager.m
//  LottieReactABI31_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//

#import "ABI31_0_0EXAnimationViewManager.h"

#import "ABI31_0_0EXContainerView.h"

// import ABI31_0_0RCTBridge.h
#if __has_include(<ReactABI31_0_0/ABI31_0_0RCTBridge.h>)
#import <ReactABI31_0_0/ABI31_0_0RCTBridge.h>
#elif __has_include("ABI31_0_0RCTBridge.h")
#import "ABI31_0_0RCTBridge.h"
#else
#import "ReactABI31_0_0/ABI31_0_0RCTBridge.h"
#endif

// import ABI31_0_0RCTUIManager.h
#if __has_include(<ReactABI31_0_0/ABI31_0_0RCTUIManager.h>)
#import <ReactABI31_0_0/ABI31_0_0RCTUIManager.h>
#elif __has_include("ABI31_0_0RCTUIManager.h")
#import "ABI31_0_0RCTUIManager.h"
#else
#import "ReactABI31_0_0/ABI31_0_0RCTUIManager.h"
#endif

#import <Lottie/Lottie.h>

@implementation ABI31_0_0EXAnimationViewManager

ABI31_0_0RCT_EXPORT_MODULE(LottieAnimationView)

- (UIView *)view
{
  return [ABI31_0_0EXContainerView new];
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

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);

ABI31_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)ReactABI31_0_0Tag
                  fromFrame:(nonnull NSNumber *) startFrame
                  toFrame:(nonnull NSNumber *) endFrame)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI31_0_0Tag];
    if (![view isKindOfClass:[ABI31_0_0EXContainerView class]]) {
      ABI31_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI31_0_0EXContainerView *lottieView = (ABI31_0_0EXContainerView *)view;
      if ([startFrame intValue] != -1 && [endFrame intValue] != -1) {
        [lottieView playFromFrame:startFrame toFrame:endFrame];
      } else {
        [lottieView play];
      }
    }
  }];
}

ABI31_0_0RCT_EXPORT_METHOD(reset:(nonnull NSNumber *)ReactABI31_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI31_0_0Tag];
    if (![view isKindOfClass:[ABI31_0_0EXContainerView class]]) {
      ABI31_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI31_0_0EXContainerView *lottieView = (ABI31_0_0EXContainerView *)view;
      [lottieView reset];
    }
  }];
}

@end
