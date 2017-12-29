//
//  ABI24_0_0EXAnimationViewManager.m
//  LottieReactABI24_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//

#import "ABI24_0_0EXAnimationViewManager.h"

#import "ABI24_0_0EXContainerView.h"

// import ABI24_0_0RCTBridge.h
#if __has_include(<ReactABI24_0_0/ABI24_0_0RCTBridge.h>)
#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#elif __has_include("ABI24_0_0RCTBridge.h")
#import "ABI24_0_0RCTBridge.h"
#else
#import "ReactABI24_0_0/ABI24_0_0RCTBridge.h"
#endif

// import ABI24_0_0RCTUIManager.h
#if __has_include(<ReactABI24_0_0/ABI24_0_0RCTUIManager.h>)
#import <ReactABI24_0_0/ABI24_0_0RCTUIManager.h>
#elif __has_include("ABI24_0_0RCTUIManager.h")
#import "ABI24_0_0RCTUIManager.h"
#else
#import "ReactABI24_0_0/ABI24_0_0RCTUIManager.h"
#endif

#import <Lottie/Lottie.h>

@implementation ABI24_0_0EXAnimationViewManager

ABI24_0_0RCT_EXPORT_MODULE(LottieAnimationView)

- (UIView *)view
{
  return [ABI24_0_0EXContainerView new];
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"VERSION": @1,
  };
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSDictionary);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);

ABI24_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)ReactABI24_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI24_0_0Tag];
    if (![view isKindOfClass:[ABI24_0_0EXContainerView class]]) {
      ABI24_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI24_0_0EXContainerView *lottieView = (ABI24_0_0EXContainerView *)view;
      [lottieView play];
    }
  }];
}

ABI24_0_0RCT_EXPORT_METHOD(reset:(nonnull NSNumber *)ReactABI24_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI24_0_0Tag];
    if (![view isKindOfClass:[ABI24_0_0EXContainerView class]]) {
      ABI24_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI24_0_0EXContainerView *lottieView = (ABI24_0_0EXContainerView *)view;
      [lottieView reset];
    }
  }];
}

@end
