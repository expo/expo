/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTScrollViewManager.h"

#import "ABI18_0_0RCTBridge.h"
#import "ABI18_0_0RCTScrollView.h"
#import "ABI18_0_0RCTShadowView.h"
#import "ABI18_0_0RCTUIManager.h"

@interface ABI18_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI18_0_0RCTConvert (UIScrollView)

ABI18_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI18_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

@end

@implementation ABI18_0_0RCTScrollViewManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI18_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollAnimationEnd, ABI18_0_0RCTDirectEventBlock)

// overflow is used both in css-layout as well as by ReactABI18_0_0-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI18_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI18_0_0YGOverflow, ABI18_0_0RCTShadowView) {
#pragma unused (json)
  view.overflow = ABI18_0_0YGOverflowScroll;
}

ABI18_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI18_0_0Tag
                  callback:(ABI18_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI18_0_0RCTScrollView *> *viewRegistry) {

    ABI18_0_0RCTScrollView *view = viewRegistry[ReactABI18_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI18_0_0RCTScrollView class]]) {
      ABI18_0_0RCTLogError(@"Cannot find ABI18_0_0RCTScrollView with tag #%@", ReactABI18_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI18_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI18_0_0Tag
                  callback:(ABI18_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI18_0_0RCTScrollView *> *viewRegistry) {

    ABI18_0_0RCTScrollView *view = viewRegistry[ReactABI18_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI18_0_0RCTScrollView class]]) {
      ABI18_0_0RCTLogError(@"Cannot find ABI18_0_0RCTScrollView with tag #%@", ReactABI18_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI18_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI18_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI18_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI18_0_0RCTScrollableProtocol)]) {
      [(id<ABI18_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI18_0_0RCTLogError(@"tried to scrollTo: on non-ABI18_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI18_0_0Tag);
    }
  }];
}

ABI18_0_0RCT_EXPORT_METHOD(scrollToEnd:(nonnull NSNumber *)ReactABI18_0_0Tag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
     UIView *view = viewRegistry[ReactABI18_0_0Tag];
     if ([view conformsToProtocol:@protocol(ABI18_0_0RCTScrollableProtocol)]) {
       [(id<ABI18_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
     } else {
       ABI18_0_0RCTLogError(@"tried to scrollTo: on non-ABI18_0_0RCTScrollableProtocol view %@ "
                   "with tag #%@", view, ReactABI18_0_0Tag);
     }
   }];
}

ABI18_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI18_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI18_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI18_0_0RCTScrollableProtocol)]) {
      [(id<ABI18_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI18_0_0RCTLogError(@"tried to zoomToRect: on non-ABI18_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI18_0_0Tag);
    }
  }];
}

@end
