/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTScrollViewManager.h"

#import "ABI17_0_0RCTBridge.h"
#import "ABI17_0_0RCTScrollView.h"
#import "ABI17_0_0RCTShadowView.h"
#import "ABI17_0_0RCTUIManager.h"

@interface ABI17_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI17_0_0RCTConvert (UIScrollView)

ABI17_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI17_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

@end

@implementation ABI17_0_0RCTScrollViewManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI17_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollAnimationEnd, ABI17_0_0RCTDirectEventBlock)

// overflow is used both in css-layout as well as by ReactABI17_0_0-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI17_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI17_0_0YGOverflow, ABI17_0_0RCTShadowView) {
#pragma unused (json)
  view.overflow = ABI17_0_0YGOverflowScroll;
}

ABI17_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI17_0_0Tag
                  callback:(ABI17_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI17_0_0RCTScrollView *> *viewRegistry) {

    ABI17_0_0RCTScrollView *view = viewRegistry[ReactABI17_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI17_0_0RCTScrollView class]]) {
      ABI17_0_0RCTLogError(@"Cannot find ABI17_0_0RCTScrollView with tag #%@", ReactABI17_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI17_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI17_0_0Tag
                  callback:(ABI17_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI17_0_0RCTScrollView *> *viewRegistry) {

    ABI17_0_0RCTScrollView *view = viewRegistry[ReactABI17_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI17_0_0RCTScrollView class]]) {
      ABI17_0_0RCTLogError(@"Cannot find ABI17_0_0RCTScrollView with tag #%@", ReactABI17_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI17_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI17_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI17_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI17_0_0RCTScrollableProtocol)]) {
      [(id<ABI17_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI17_0_0RCTLogError(@"tried to scrollTo: on non-ABI17_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI17_0_0Tag);
    }
  }];
}

ABI17_0_0RCT_EXPORT_METHOD(scrollToEnd:(nonnull NSNumber *)ReactABI17_0_0Tag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
     UIView *view = viewRegistry[ReactABI17_0_0Tag];
     if ([view conformsToProtocol:@protocol(ABI17_0_0RCTScrollableProtocol)]) {
       [(id<ABI17_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
     } else {
       ABI17_0_0RCTLogError(@"tried to scrollTo: on non-ABI17_0_0RCTScrollableProtocol view %@ "
                   "with tag #%@", view, ReactABI17_0_0Tag);
     }
   }];
}

ABI17_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI17_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI17_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI17_0_0RCTScrollableProtocol)]) {
      [(id<ABI17_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI17_0_0RCTLogError(@"tried to zoomToRect: on non-ABI17_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI17_0_0Tag);
    }
  }];
}

@end
