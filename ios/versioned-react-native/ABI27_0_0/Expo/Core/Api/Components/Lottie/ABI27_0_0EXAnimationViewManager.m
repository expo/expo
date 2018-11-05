//
//  ABI27_0_0EXAnimationViewManager.m
//  LottieReactABI27_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//

#import "ABI27_0_0EXAnimationViewManager.h"

#import "ABI27_0_0EXContainerView.h"

// import ABI27_0_0RCTBridge.h
#if __has_include(<ReactABI27_0_0/ABI27_0_0RCTBridge.h>)
#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#elif __has_include("ABI27_0_0RCTBridge.h")
#import "ABI27_0_0RCTBridge.h"
#else
#import "ReactABI27_0_0/ABI27_0_0RCTBridge.h"
#endif

// import ABI27_0_0RCTUIManager.h
#if __has_include(<ReactABI27_0_0/ABI27_0_0RCTUIManager.h>)
#import <ReactABI27_0_0/ABI27_0_0RCTUIManager.h>
#elif __has_include("ABI27_0_0RCTUIManager.h")
#import "ABI27_0_0RCTUIManager.h"
#else
#import "ReactABI27_0_0/ABI27_0_0RCTUIManager.h"
#endif

#import <Lottie/Lottie.h>

@implementation ABI27_0_0EXAnimationViewManager

ABI27_0_0RCT_EXPORT_MODULE(LottieAnimationView)

- (UIView *)view
{
  return [ABI27_0_0EXContainerView new];
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

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSString);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);

ABI27_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)ReactABI27_0_0Tag
                  fromFrame:(nonnull NSNumber *) startFrame
                  toFrame:(nonnull NSNumber *) endFrame)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI27_0_0Tag];
    if (![view isKindOfClass:[ABI27_0_0EXContainerView class]]) {
      ABI27_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI27_0_0EXContainerView *lottieView = (ABI27_0_0EXContainerView *)view;
      if ([startFrame intValue] != -1 && [endFrame intValue] != -1) {
        [lottieView playFromFrame:startFrame toFrame:endFrame];
      } else {
        [lottieView play];
      }
    }
  }];
}

ABI27_0_0RCT_EXPORT_METHOD(reset:(nonnull NSNumber *)ReactABI27_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI27_0_0Tag];
    if (![view isKindOfClass:[ABI27_0_0EXContainerView class]]) {
      ABI27_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI27_0_0EXContainerView *lottieView = (ABI27_0_0EXContainerView *)view;
      [lottieView reset];
    }
  }];
}

@end
