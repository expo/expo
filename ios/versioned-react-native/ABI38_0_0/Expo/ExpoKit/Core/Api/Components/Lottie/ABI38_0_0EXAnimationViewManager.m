//
//  ABI38_0_0EXAnimationViewManager.m
//  LottieABI38_0_0ReactNative
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//

#import "ABI38_0_0EXAnimationViewManager.h"

#import "ABI38_0_0EXContainerView.h"

// import ABI38_0_0RCTBridge.h
#if __has_include(<ABI38_0_0React/ABI38_0_0RCTBridge.h>)
#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#elif __has_include("ABI38_0_0RCTBridge.h")
#import "ABI38_0_0RCTBridge.h"
#else
#import "ABI38_0_0React/ABI38_0_0RCTBridge.h"
#endif

// import ABI38_0_0RCTUIManager.h
#if __has_include(<ABI38_0_0React/ABI38_0_0RCTUIManager.h>)
#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>
#elif __has_include("ABI38_0_0RCTUIManager.h")
#import "ABI38_0_0RCTUIManager.h"
#else
#import "ABI38_0_0React/ABI38_0_0RCTUIManager.h"
#endif

#import <Lottie/Lottie.h>

@implementation ABI38_0_0EXAnimationViewManager

ABI38_0_0RCT_EXPORT_MODULE(LottieAnimationView)

- (UIView *)view
{
  return [ABI38_0_0EXContainerView new];
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

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI38_0_0RCTBubblingEventBlock);

ABI38_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)ABI38_0_0ReactTag
                  fromFrame:(nonnull NSNumber *) startFrame
                  toFrame:(nonnull NSNumber *) endFrame)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI38_0_0ReactTag];
    if (![view isKindOfClass:[ABI38_0_0EXContainerView class]]) {
      ABI38_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI38_0_0EXContainerView *lottieView = (ABI38_0_0EXContainerView *)view;
      LOTAnimationCompletionBlock callback = ^(BOOL animationFinished){
        if (lottieView.onAnimationFinish) {
          lottieView.onAnimationFinish(@{@"isCancelled": animationFinished ? @NO : @YES});
        }
      };
      if ([startFrame intValue] != -1 && [endFrame intValue] != -1) {
        [lottieView playFromFrame:startFrame toFrame:endFrame withCompletion:callback];
      } else {
        [lottieView play:callback];
      }
    }
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(reset:(nonnull NSNumber *)ABI38_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI38_0_0ReactTag];
    if (![view isKindOfClass:[ABI38_0_0EXContainerView class]]) {
      ABI38_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI38_0_0EXContainerView *lottieView = (ABI38_0_0EXContainerView *)view;
      [lottieView reset];
    }
  }];
}

@end
