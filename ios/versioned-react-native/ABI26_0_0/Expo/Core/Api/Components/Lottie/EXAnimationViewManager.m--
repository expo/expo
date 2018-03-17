//
//  ABI26_0_0EXAnimationViewManager.m
//  LottieReactABI26_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//

#import "ABI26_0_0EXAnimationViewManager.h"

#import "ABI26_0_0EXContainerView.h"

// import ABI26_0_0RCTBridge.h
#if __has_include(<ReactABI26_0_0/ABI26_0_0RCTBridge.h>)
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#elif __has_include("ABI26_0_0RCTBridge.h")
#import "ABI26_0_0RCTBridge.h"
#else
#import "ReactABI26_0_0/ABI26_0_0RCTBridge.h"
#endif

// import ABI26_0_0RCTUIManager.h
#if __has_include(<ReactABI26_0_0/ABI26_0_0RCTUIManager.h>)
#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>
#elif __has_include("ABI26_0_0RCTUIManager.h")
#import "ABI26_0_0RCTUIManager.h"
#else
#import "ReactABI26_0_0/ABI26_0_0RCTUIManager.h"
#endif

#import <Lottie/Lottie.h>

@implementation ABI26_0_0EXAnimationViewManager

ABI26_0_0RCT_EXPORT_MODULE(LottieAnimationView)

- (UIView *)view
{
  return [ABI26_0_0EXContainerView new];
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

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);

ABI26_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)ReactABI26_0_0Tag
                  fromFrame:(nonnull NSNumber *) startFrame
                  toFrame:(nonnull NSNumber *) endFrame)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI26_0_0Tag];
    if (![view isKindOfClass:[ABI26_0_0EXContainerView class]]) {
      ABI26_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI26_0_0EXContainerView *lottieView = (ABI26_0_0EXContainerView *)view;
      if ([startFrame intValue] != -1 && [endFrame intValue] != -1) {
        [lottieView playFromFrame:startFrame toFrame:endFrame];
      } else {
        [lottieView play];
      }
    }
  }];
}

ABI26_0_0RCT_EXPORT_METHOD(reset:(nonnull NSNumber *)ReactABI26_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI26_0_0Tag];
    if (![view isKindOfClass:[ABI26_0_0EXContainerView class]]) {
      ABI26_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI26_0_0EXContainerView *lottieView = (ABI26_0_0EXContainerView *)view;
      [lottieView reset];
    }
  }];
}

@end
