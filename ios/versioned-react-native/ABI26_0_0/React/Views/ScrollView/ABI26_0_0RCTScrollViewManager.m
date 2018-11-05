/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTScrollViewManager.h"

#import "ABI26_0_0RCTBridge.h"
#import "ABI26_0_0RCTScrollView.h"
#import "ABI26_0_0RCTShadowView.h"
#import "ABI26_0_0RCTUIManager.h"

@interface ABI26_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI26_0_0RCTConvert (UIScrollView)

ABI26_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI26_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI26_0_0RCT_ENUM_CONVERTER(UIScrollViewContentInsetAdjustmentBehavior, (@{
  @"automatic": @(UIScrollViewContentInsetAdjustmentAutomatic),
  @"scrollableAxes": @(UIScrollViewContentInsetAdjustmentScrollableAxes),
  @"never": @(UIScrollViewContentInsetAdjustmentNever),
  @"always": @(UIScrollViewContentInsetAdjustmentAlways),
}), UIScrollViewContentInsetAdjustmentNever, integerValue)
#endif

@end

@implementation ABI26_0_0RCTScrollViewManager

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI26_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(maintainVisibleContentPosition, NSDictionary)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(pinchGestureEnabled, scrollView.pinchGestureEnabled, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(DEPRECATED_sendUpdatedChildFrames, BOOL)
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)
#endif

// overflow is used both in css-layout as well as by ReactABI26_0_0-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI26_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI26_0_0YGOverflow, ABI26_0_0RCTShadowView) {
#pragma unused (json)
  view.overflow = ABI26_0_0YGOverflowScroll;
}

ABI26_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI26_0_0Tag
                  callback:(ABI26_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI26_0_0RCTScrollView *> *viewRegistry) {

    ABI26_0_0RCTScrollView *view = viewRegistry[ReactABI26_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI26_0_0RCTScrollView class]]) {
      ABI26_0_0RCTLogError(@"Cannot find ABI26_0_0RCTScrollView with tag #%@", ReactABI26_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI26_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI26_0_0Tag
                  callback:(ABI26_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI26_0_0RCTScrollView *> *viewRegistry) {

    ABI26_0_0RCTScrollView *view = viewRegistry[ReactABI26_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI26_0_0RCTScrollView class]]) {
      ABI26_0_0RCTLogError(@"Cannot find ABI26_0_0RCTScrollView with tag #%@", ReactABI26_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI26_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI26_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI26_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI26_0_0RCTScrollableProtocol)]) {
      [(id<ABI26_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI26_0_0RCTLogError(@"tried to scrollTo: on non-ABI26_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI26_0_0Tag);
    }
  }];
}

ABI26_0_0RCT_EXPORT_METHOD(scrollToEnd:(nonnull NSNumber *)ReactABI26_0_0Tag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
     UIView *view = viewRegistry[ReactABI26_0_0Tag];
     if ([view conformsToProtocol:@protocol(ABI26_0_0RCTScrollableProtocol)]) {
       [(id<ABI26_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
     } else {
       ABI26_0_0RCTLogError(@"tried to scrollTo: on non-ABI26_0_0RCTScrollableProtocol view %@ "
                   "with tag #%@", view, ReactABI26_0_0Tag);
     }
   }];
}

ABI26_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI26_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI26_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI26_0_0RCTScrollableProtocol)]) {
      [(id<ABI26_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI26_0_0RCTLogError(@"tried to zoomToRect: on non-ABI26_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI26_0_0Tag);
    }
  }];
}

ABI26_0_0RCT_EXPORT_METHOD(flashScrollIndicators:(nonnull NSNumber *)ReactABI26_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI26_0_0RCTScrollView *> *viewRegistry){

     ABI26_0_0RCTScrollView *view = viewRegistry[ReactABI26_0_0Tag];
     if (!view || ![view isKindOfClass:[ABI26_0_0RCTScrollView class]]) {
       ABI26_0_0RCTLogError(@"Cannot find ABI26_0_0RCTScrollView with tag #%@", ReactABI26_0_0Tag);
       return;
     }

     [view.scrollView flashScrollIndicators];
   }];
}

@end
