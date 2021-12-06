/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTScrollViewManager.h"

#import "ABI44_0_0RCTBridge.h"
#import "ABI44_0_0RCTScrollView.h"
#import "ABI44_0_0RCTShadowView.h"
#import "ABI44_0_0RCTUIManager.h"

@implementation ABI44_0_0RCTConvert (UIScrollView)

ABI44_0_0RCT_ENUM_CONVERTER(
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

ABI44_0_0RCT_ENUM_CONVERTER(
    UIScrollViewIndicatorStyle,
    (@{
      @"default" : @(UIScrollViewIndicatorStyleDefault),
      @"black" : @(UIScrollViewIndicatorStyleBlack),
      @"white" : @(UIScrollViewIndicatorStyleWhite),
    }),
    UIScrollViewIndicatorStyleDefault,
    integerValue)

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI44_0_0RCT_ENUM_CONVERTER(
    UIScrollViewContentInsetAdjustmentBehavior,
    (@{
      @"automatic" : @(UIScrollViewContentInsetAdjustmentAutomatic),
      @"scrollableAxes" : @(UIScrollViewContentInsetAdjustmentScrollableAxes),
      @"never" : @(UIScrollViewContentInsetAdjustmentNever),
      @"always" : @(UIScrollViewContentInsetAdjustmentAlways),
    }),
    UIScrollViewContentInsetAdjustmentNever,
    integerValue)
#endif
#pragma clang diagnostic pop

@end

@implementation ABI44_0_0RCTScrollViewManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI44_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maintainVisibleContentPosition, NSDictionary)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(pinchGestureEnabled, scrollView.pinchGestureEnabled, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(scrollToOverflowEnabled, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(disableIntervalMomentum, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(snapToOffsets, NSArray<NSNumber *>)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(snapToStart, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(snapToEnd, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollToTop, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL)
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)
#endif

// overflow is used both in css-layout as well as by ABI44_0_0React-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI44_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI44_0_0YGOverflow, ABI44_0_0RCTShadowView)
{
#pragma unused(json)
  view.overflow = ABI44_0_0YGOverflowScroll;
}

ABI44_0_0RCT_EXPORT_METHOD(getContentSize : (nonnull NSNumber *)ABI44_0_0ReactTag callback : (ABI44_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI44_0_0RCTScrollView *> *viewRegistry) {
        ABI44_0_0RCTScrollView *view = viewRegistry[ABI44_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI44_0_0RCTScrollView class]]) {
          ABI44_0_0RCTLogError(@"Cannot find ABI44_0_0RCTScrollView with tag #%@", ABI44_0_0ReactTag);
          return;
        }

        CGSize size = view.scrollView.contentSize;
        callback(@[ @{@"width" : @(size.width), @"height" : @(size.height)} ]);
      }];
}

ABI44_0_0RCT_EXPORT_METHOD(scrollTo
                  : (nonnull NSNumber *)ABI44_0_0ReactTag offsetX
                  : (CGFloat)x offsetY
                  : (CGFloat)y animated
                  : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI44_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI44_0_0RCTScrollableProtocol)]) {
          [(id<ABI44_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
        } else {
          ABI44_0_0RCTLogError(
              @"tried to scrollTo: on non-ABI44_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI44_0_0ReactTag);
        }
      }];
}

ABI44_0_0RCT_EXPORT_METHOD(scrollToEnd : (nonnull NSNumber *)ABI44_0_0ReactTag animated : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI44_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI44_0_0RCTScrollableProtocol)]) {
          [(id<ABI44_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
        } else {
          ABI44_0_0RCTLogError(
              @"tried to scrollTo: on non-ABI44_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI44_0_0ReactTag);
        }
      }];
}

ABI44_0_0RCT_EXPORT_METHOD(zoomToRect : (nonnull NSNumber *)ABI44_0_0ReactTag withRect : (CGRect)rect animated : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI44_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI44_0_0RCTScrollableProtocol)]) {
          [(id<ABI44_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
        } else {
          ABI44_0_0RCTLogError(
              @"tried to zoomToRect: on non-ABI44_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI44_0_0ReactTag);
        }
      }];
}

ABI44_0_0RCT_EXPORT_METHOD(flashScrollIndicators : (nonnull NSNumber *)ABI44_0_0ReactTag)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI44_0_0RCTScrollView *> *viewRegistry) {
        ABI44_0_0RCTScrollView *view = viewRegistry[ABI44_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI44_0_0RCTScrollView class]]) {
          ABI44_0_0RCTLogError(@"Cannot find ABI44_0_0RCTScrollView with tag #%@", ABI44_0_0ReactTag);
          return;
        }

        [view.scrollView flashScrollIndicators];
      }];
}

@end
