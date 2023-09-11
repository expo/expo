/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTScrollViewManager.h"

#import "ABI48_0_0RCTBridge.h"
#import "ABI48_0_0RCTScrollView.h"
#import "ABI48_0_0RCTShadowView.h"
#import "ABI48_0_0RCTUIManager.h"

@implementation ABI48_0_0RCTConvert (UIScrollView)

ABI48_0_0RCT_ENUM_CONVERTER(
    UIScrollViewKeyboardDismissMode,
    (@{
      @"none" : @(UIScrollViewKeyboardDismissModeNone),
      @"on-drag" : @(UIScrollViewKeyboardDismissModeOnDrag),
      @"interactive" : @(UIScrollViewKeyboardDismissModeInteractive),
      // Backwards compatibility
      @"onDrag" : @(UIScrollViewKeyboardDismissModeOnDrag),
    }),
    UIScrollViewKeyboardDismissModeNone,
    integerValue)

ABI48_0_0RCT_ENUM_CONVERTER(
    UIScrollViewIndicatorStyle,
    (@{
      @"default" : @(UIScrollViewIndicatorStyleDefault),
      @"black" : @(UIScrollViewIndicatorStyleBlack),
      @"white" : @(UIScrollViewIndicatorStyleWhite),
    }),
    UIScrollViewIndicatorStyleDefault,
    integerValue)

ABI48_0_0RCT_ENUM_CONVERTER(
    UIScrollViewContentInsetAdjustmentBehavior,
    (@{
      @"automatic" : @(UIScrollViewContentInsetAdjustmentAutomatic),
      @"scrollableAxes" : @(UIScrollViewContentInsetAdjustmentScrollableAxes),
      @"never" : @(UIScrollViewContentInsetAdjustmentNever),
      @"always" : @(UIScrollViewContentInsetAdjustmentAlways),
    }),
    UIScrollViewContentInsetAdjustmentNever,
    integerValue)

@end

@implementation ABI48_0_0RCTScrollViewManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI48_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(maintainVisibleContentPosition, NSDictionary)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustKeyboardInsets, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(pinchGestureEnabled, scrollView.pinchGestureEnabled, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(scrollToOverflowEnabled, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(disableIntervalMomentum, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(snapToOffsets, NSArray<NSNumber *>)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(snapToStart, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(snapToEnd, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollToTop, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL)
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* __IPHONE_13_0 */
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustsScrollIndicatorInsets, BOOL)
#endif
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)

// overflow is used both in css-layout as well as by ABI48_0_0React-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI48_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI48_0_0YGOverflow, ABI48_0_0RCTShadowView)
{
#pragma unused(json)
  view.overflow = ABI48_0_0YGOverflowScroll;
}

ABI48_0_0RCT_EXPORT_METHOD(getContentSize : (nonnull NSNumber *)ABI48_0_0ReactTag callback : (ABI48_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI48_0_0RCTScrollView *> *viewRegistry) {
        ABI48_0_0RCTScrollView *view = viewRegistry[ABI48_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI48_0_0RCTScrollView class]]) {
          ABI48_0_0RCTLogError(@"Cannot find ABI48_0_0RCTScrollView with tag #%@", ABI48_0_0ReactTag);
          return;
        }

        CGSize size = view.scrollView.contentSize;
        callback(@[ @{@"width" : @(size.width), @"height" : @(size.height)} ]);
      }];
}

ABI48_0_0RCT_EXPORT_METHOD(scrollTo
                  : (nonnull NSNumber *)ABI48_0_0ReactTag offsetX
                  : (CGFloat)x offsetY
                  : (CGFloat)y animated
                  : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI48_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI48_0_0RCTScrollableProtocol)]) {
          [(id<ABI48_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
        } else {
          ABI48_0_0RCTLogError(
              @"tried to scrollTo: on non-ABI48_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI48_0_0ReactTag);
        }
      }];
}

ABI48_0_0RCT_EXPORT_METHOD(scrollToEnd : (nonnull NSNumber *)ABI48_0_0ReactTag animated : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI48_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI48_0_0RCTScrollableProtocol)]) {
          [(id<ABI48_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
        } else {
          ABI48_0_0RCTLogError(
              @"tried to scrollTo: on non-ABI48_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI48_0_0ReactTag);
        }
      }];
}

ABI48_0_0RCT_EXPORT_METHOD(zoomToRect : (nonnull NSNumber *)ABI48_0_0ReactTag withRect : (CGRect)rect animated : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI48_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI48_0_0RCTScrollableProtocol)]) {
          [(id<ABI48_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
        } else {
          ABI48_0_0RCTLogError(
              @"tried to zoomToRect: on non-ABI48_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI48_0_0ReactTag);
        }
      }];
}

ABI48_0_0RCT_EXPORT_METHOD(flashScrollIndicators : (nonnull NSNumber *)ABI48_0_0ReactTag)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI48_0_0RCTScrollView *> *viewRegistry) {
        ABI48_0_0RCTScrollView *view = viewRegistry[ABI48_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI48_0_0RCTScrollView class]]) {
          ABI48_0_0RCTLogError(@"Cannot find ABI48_0_0RCTScrollView with tag #%@", ABI48_0_0ReactTag);
          return;
        }

        [view.scrollView flashScrollIndicators];
      }];
}

@end
