//
//  ABI15_0_0EXAnimationViewManager.m
//  LottieReactABI15_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//

#import "ABI15_0_0EXAnimationViewManager.h"

#import "ABI15_0_0EXContainerView.h"

// import ABI15_0_0RCTBridge.h
#if __has_include(<ReactABI15_0_0/ABI15_0_0RCTBridge.h>)
#import <ReactABI15_0_0/ABI15_0_0RCTBridge.h>
#elif __has_include("ABI15_0_0RCTBridge.h")
#import "ABI15_0_0RCTBridge.h"
#else
#import "ReactABI15_0_0/ABI15_0_0RCTBridge.h"
#endif

// import ABI15_0_0RCTUIManager.h
#if __has_include(<ReactABI15_0_0/ABI15_0_0RCTUIManager.h>)
#import <ReactABI15_0_0/ABI15_0_0RCTUIManager.h>
#elif __has_include("ABI15_0_0RCTUIManager.h")
#import "ABI15_0_0RCTUIManager.h"
#else
#import "ReactABI15_0_0/ABI15_0_0RCTUIManager.h"
#endif

#import <Lottie/Lottie.h>

@implementation ABI15_0_0EXAnimationViewManager

ABI15_0_0RCT_EXPORT_MODULE(LottieAnimationView)

- (UIView *)view
{
  return [ABI15_0_0EXContainerView new];
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"VERSION": @1,
  };
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSDictionary);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);

ABI15_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)ReactABI15_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI15_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI15_0_0Tag];
    if (![view isKindOfClass:[ABI15_0_0EXContainerView class]]) {
      ABI15_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI15_0_0EXContainerView *lottieView = (ABI15_0_0EXContainerView *)view;
      [lottieView play];
    }
  }];
}

ABI15_0_0RCT_EXPORT_METHOD(reset:(nonnull NSNumber *)ReactABI15_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI15_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI15_0_0Tag];
    if (![view isKindOfClass:[ABI15_0_0EXContainerView class]]) {
      ABI15_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI15_0_0EXContainerView *lottieView = (ABI15_0_0EXContainerView *)view;
      [lottieView reset];
    }
  }];
}

@end
