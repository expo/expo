//
//  ABI33_0_0EXAnimationViewManager.m
//  LottieReactABI33_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//

#import "ABI33_0_0EXAnimationViewManager.h"

#import "ABI33_0_0EXContainerView.h"

// import ABI33_0_0RCTBridge.h
#if __has_include(<ReactABI33_0_0/ABI33_0_0RCTBridge.h>)
#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#elif __has_include("ABI33_0_0RCTBridge.h")
#import "ABI33_0_0RCTBridge.h"
#else
#import "ReactABI33_0_0/ABI33_0_0RCTBridge.h"
#endif

// import ABI33_0_0RCTUIManager.h
#if __has_include(<ReactABI33_0_0/ABI33_0_0RCTUIManager.h>)
#import <ReactABI33_0_0/ABI33_0_0RCTUIManager.h>
#elif __has_include("ABI33_0_0RCTUIManager.h")
#import "ABI33_0_0RCTUIManager.h"
#else
#import "ReactABI33_0_0/ABI33_0_0RCTUIManager.h"
#endif

#import <Lottie/Lottie.h>

@implementation ABI33_0_0EXAnimationViewManager

ABI33_0_0RCT_EXPORT_MODULE(LottieAnimationView)

- (UIView *)view
{
  return [ABI33_0_0EXContainerView new];
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

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onAnimationFinish, ABI33_0_0RCTBubblingEventBlock);

ABI33_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)ReactABI33_0_0Tag
                  fromFrame:(nonnull NSNumber *) startFrame
                  toFrame:(nonnull NSNumber *) endFrame)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0EXContainerView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI33_0_0EXContainerView *lottieView = (ABI33_0_0EXContainerView *)view;
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

ABI33_0_0RCT_EXPORT_METHOD(reset:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0EXContainerView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI33_0_0EXContainerView *lottieView = (ABI33_0_0EXContainerView *)view;
      [lottieView reset];
    }
  }];
}

@end
