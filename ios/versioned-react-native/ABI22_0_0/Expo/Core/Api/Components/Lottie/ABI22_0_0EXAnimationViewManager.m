//
//  ABI22_0_0EXAnimationViewManager.m
//  LottieReactABI22_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//

#import "ABI22_0_0EXAnimationViewManager.h"

#import "ABI22_0_0EXContainerView.h"

// import ABI22_0_0RCTBridge.h
#if __has_include(<ReactABI22_0_0/ABI22_0_0RCTBridge.h>)
#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>
#elif __has_include("ABI22_0_0RCTBridge.h")
#import "ABI22_0_0RCTBridge.h"
#else
#import "ReactABI22_0_0/ABI22_0_0RCTBridge.h"
#endif

// import ABI22_0_0RCTUIManager.h
#if __has_include(<ReactABI22_0_0/ABI22_0_0RCTUIManager.h>)
#import <ReactABI22_0_0/ABI22_0_0RCTUIManager.h>
#elif __has_include("ABI22_0_0RCTUIManager.h")
#import "ABI22_0_0RCTUIManager.h"
#else
#import "ReactABI22_0_0/ABI22_0_0RCTUIManager.h"
#endif

#import <Lottie/Lottie.h>

@implementation ABI22_0_0EXAnimationViewManager

ABI22_0_0RCT_EXPORT_MODULE(LottieAnimationView)

- (UIView *)view
{
  return [ABI22_0_0EXContainerView new];
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"VERSION": @1,
  };
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(sourceJson, NSDictionary);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(sourceName, NSString);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(progress, CGFloat);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(loop, BOOL);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(speed, CGFloat);

ABI22_0_0RCT_EXPORT_METHOD(play:(nonnull NSNumber *)ReactABI22_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI22_0_0Tag];
    if (![view isKindOfClass:[ABI22_0_0EXContainerView class]]) {
      ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI22_0_0EXContainerView *lottieView = (ABI22_0_0EXContainerView *)view;
      [lottieView play];
    }
  }];
}

ABI22_0_0RCT_EXPORT_METHOD(reset:(nonnull NSNumber *)ReactABI22_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI22_0_0Tag];
    if (![view isKindOfClass:[ABI22_0_0EXContainerView class]]) {
      ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting LottieContainerView, got: %@", view);
    } else {
      ABI22_0_0EXContainerView *lottieView = (ABI22_0_0EXContainerView *)view;
      [lottieView reset];
    }
  }];
}

@end
