/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTScrollViewManager.h"

#import "ABI49_0_0RCTBridge.h"
#import "ABI49_0_0RCTScrollView.h"
#import "ABI49_0_0RCTShadowView.h"
#import "ABI49_0_0RCTUIManager.h"

@implementation ABI49_0_0RCTConvert (UIScrollView)

ABI49_0_0RCT_ENUM_CONVERTER(
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

ABI49_0_0RCT_ENUM_CONVERTER(
    UIScrollViewIndicatorStyle,
    (@{
      @"default" : @(UIScrollViewIndicatorStyleDefault),
      @"black" : @(UIScrollViewIndicatorStyleBlack),
      @"white" : @(UIScrollViewIndicatorStyleWhite),
    }),
    UIScrollViewIndicatorStyleDefault,
    integerValue)

ABI49_0_0RCT_ENUM_CONVERTER(
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

@implementation ABI49_0_0RCTScrollViewManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI49_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maintainVisibleContentPosition, NSDictionary)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustKeyboardInsets, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(pinchGestureEnabled, scrollView.pinchGestureEnabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(scrollToOverflowEnabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(disableIntervalMomentum, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(snapToOffsets, NSArray<NSNumber *>)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(snapToStart, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(snapToEnd, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollToTop, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL)
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* __IPHONE_13_0 */
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustsScrollIndicatorInsets, BOOL)
#endif
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)

// overflow is used both in css-layout as well as by ABI49_0_0React-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI49_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI49_0_0YGOverflow, ABI49_0_0RCTShadowView)
{
#pragma unused(json)
  view.overflow = ABI49_0_0YGOverflowScroll;
}

ABI49_0_0RCT_EXPORT_METHOD(getContentSize : (nonnull NSNumber *)ABI49_0_0ReactTag callback : (ABI49_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI49_0_0RCTScrollView *> *viewRegistry) {
        ABI49_0_0RCTScrollView *view = viewRegistry[ABI49_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI49_0_0RCTScrollView class]]) {
          ABI49_0_0RCTLogError(@"Cannot find ABI49_0_0RCTScrollView with tag #%@", ABI49_0_0ReactTag);
          return;
        }

        CGSize size = view.scrollView.contentSize;
        callback(@[ @{@"width" : @(size.width), @"height" : @(size.height)} ]);
      }];
}

ABI49_0_0RCT_EXPORT_METHOD(scrollTo
                  : (nonnull NSNumber *)ABI49_0_0ReactTag offsetX
                  : (CGFloat)x offsetY
                  : (CGFloat)y animated
                  : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI49_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI49_0_0RCTScrollableProtocol)]) {
          [(id<ABI49_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
        } else {
          ABI49_0_0RCTLogError(
              @"tried to scrollTo: on non-ABI49_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI49_0_0ReactTag);
        }
      }];
}

ABI49_0_0RCT_EXPORT_METHOD(scrollToEnd : (nonnull NSNumber *)ABI49_0_0ReactTag animated : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI49_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI49_0_0RCTScrollableProtocol)]) {
          [(id<ABI49_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
        } else {
          ABI49_0_0RCTLogError(
              @"tried to scrollTo: on non-ABI49_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI49_0_0ReactTag);
        }
      }];
}

ABI49_0_0RCT_EXPORT_METHOD(zoomToRect : (nonnull NSNumber *)ABI49_0_0ReactTag withRect : (CGRect)rect animated : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI49_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI49_0_0RCTScrollableProtocol)]) {
          [(id<ABI49_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
        } else {
          ABI49_0_0RCTLogError(
              @"tried to zoomToRect: on non-ABI49_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI49_0_0ReactTag);
        }
      }];
}

ABI49_0_0RCT_EXPORT_METHOD(flashScrollIndicators : (nonnull NSNumber *)ABI49_0_0ReactTag)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI49_0_0RCTScrollView *> *viewRegistry) {
        ABI49_0_0RCTScrollView *view = viewRegistry[ABI49_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI49_0_0RCTScrollView class]]) {
          ABI49_0_0RCTLogError(@"Cannot find ABI49_0_0RCTScrollView with tag #%@", ABI49_0_0ReactTag);
          return;
        }

        [view.scrollView flashScrollIndicators];
      }];
}

@end
