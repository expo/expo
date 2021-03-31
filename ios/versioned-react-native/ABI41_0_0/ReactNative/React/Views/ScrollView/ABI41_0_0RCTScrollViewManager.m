/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTScrollViewManager.h"

#import "ABI41_0_0RCTBridge.h"
#import "ABI41_0_0RCTScrollView.h"
#import "ABI41_0_0RCTShadowView.h"
#import "ABI41_0_0RCTUIManager.h"

@interface ABI41_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI41_0_0RCTConvert (UIScrollView)

ABI41_0_0RCT_ENUM_CONVERTER(
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

ABI41_0_0RCT_ENUM_CONVERTER(
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
ABI41_0_0RCT_ENUM_CONVERTER(
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

@implementation ABI41_0_0RCTScrollViewManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI41_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(maintainVisibleContentPosition, NSDictionary)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(pinchGestureEnabled, scrollView.pinchGestureEnabled, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(scrollToOverflowEnabled, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(disableIntervalMomentum, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(snapToOffsets, NSArray<NSNumber *>)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(snapToStart, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(snapToEnd, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollToTop, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(DEPRECATED_sendUpdatedChildFrames, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL)
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)
#endif

// overflow is used both in css-layout as well as by ABI41_0_0React-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI41_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI41_0_0YGOverflow, ABI41_0_0RCTShadowView)
{
#pragma unused(json)
  view.overflow = ABI41_0_0YGOverflowScroll;
}

ABI41_0_0RCT_EXPORT_METHOD(getContentSize : (nonnull NSNumber *)ABI41_0_0ReactTag callback : (ABI41_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI41_0_0RCTScrollView *> *viewRegistry) {
        ABI41_0_0RCTScrollView *view = viewRegistry[ABI41_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI41_0_0RCTScrollView class]]) {
          ABI41_0_0RCTLogError(@"Cannot find ABI41_0_0RCTScrollView with tag #%@", ABI41_0_0ReactTag);
          return;
        }

        CGSize size = view.scrollView.contentSize;
        callback(@[ @{@"width" : @(size.width), @"height" : @(size.height)} ]);
      }];
}

ABI41_0_0RCT_EXPORT_METHOD(calculateChildFrames : (nonnull NSNumber *)ABI41_0_0ReactTag callback : (ABI41_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI41_0_0RCTScrollView *> *viewRegistry) {
        ABI41_0_0RCTScrollView *view = viewRegistry[ABI41_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI41_0_0RCTScrollView class]]) {
          ABI41_0_0RCTLogError(@"Cannot find ABI41_0_0RCTScrollView with tag #%@", ABI41_0_0ReactTag);
          return;
        }

        NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
        if (childFrames) {
          callback(@[ childFrames ]);
        }
      }];
}

ABI41_0_0RCT_EXPORT_METHOD(scrollTo
                  : (nonnull NSNumber *)ABI41_0_0ReactTag offsetX
                  : (CGFloat)x offsetY
                  : (CGFloat)y animated
                  : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI41_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI41_0_0RCTScrollableProtocol)]) {
          [(id<ABI41_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
        } else {
          ABI41_0_0RCTLogError(
              @"tried to scrollTo: on non-ABI41_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI41_0_0ReactTag);
        }
      }];
}

ABI41_0_0RCT_EXPORT_METHOD(scrollToEnd : (nonnull NSNumber *)ABI41_0_0ReactTag animated : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI41_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI41_0_0RCTScrollableProtocol)]) {
          [(id<ABI41_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
        } else {
          ABI41_0_0RCTLogError(
              @"tried to scrollTo: on non-ABI41_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI41_0_0ReactTag);
        }
      }];
}

ABI41_0_0RCT_EXPORT_METHOD(zoomToRect : (nonnull NSNumber *)ABI41_0_0ReactTag withRect : (CGRect)rect animated : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[ABI41_0_0ReactTag];
        if ([view conformsToProtocol:@protocol(ABI41_0_0RCTScrollableProtocol)]) {
          [(id<ABI41_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
        } else {
          ABI41_0_0RCTLogError(
              @"tried to zoomToRect: on non-ABI41_0_0RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              ABI41_0_0ReactTag);
        }
      }];
}

ABI41_0_0RCT_EXPORT_METHOD(flashScrollIndicators : (nonnull NSNumber *)ABI41_0_0ReactTag)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI41_0_0RCTScrollView *> *viewRegistry) {
        ABI41_0_0RCTScrollView *view = viewRegistry[ABI41_0_0ReactTag];
        if (!view || ![view isKindOfClass:[ABI41_0_0RCTScrollView class]]) {
          ABI41_0_0RCTLogError(@"Cannot find ABI41_0_0RCTScrollView with tag #%@", ABI41_0_0ReactTag);
          return;
        }

        [view.scrollView flashScrollIndicators];
      }];
}

@end
