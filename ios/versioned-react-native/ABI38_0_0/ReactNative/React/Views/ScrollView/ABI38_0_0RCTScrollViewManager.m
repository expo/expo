/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTScrollViewManager.h"

#import "ABI38_0_0RCTBridge.h"
#import "ABI38_0_0RCTScrollView.h"
#import "ABI38_0_0RCTShadowView.h"
#import "ABI38_0_0RCTUIManager.h"

@interface ABI38_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI38_0_0RCTConvert (UIScrollView)

ABI38_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI38_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI38_0_0RCT_ENUM_CONVERTER(UIScrollViewContentInsetAdjustmentBehavior, (@{
  @"automatic": @(UIScrollViewContentInsetAdjustmentAutomatic),
  @"scrollableAxes": @(UIScrollViewContentInsetAdjustmentScrollableAxes),
  @"never": @(UIScrollViewContentInsetAdjustmentNever),
  @"always": @(UIScrollViewContentInsetAdjustmentAlways),
}), UIScrollViewContentInsetAdjustmentNever, integerValue)
#endif
#pragma clang diagnostic pop

@end

@implementation ABI38_0_0RCTScrollViewManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI38_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maintainVisibleContentPosition, NSDictionary)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(pinchGestureEnabled, scrollView.pinchGestureEnabled, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(scrollToOverflowEnabled, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(disableIntervalMomentum, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(snapToOffsets, NSArray<NSNumber *>)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(snapToStart, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(snapToEnd, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollToTop, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(DEPRECATED_sendUpdatedChildFrames, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL)
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)
#endif

// overflow is used both in css-layout as well as by ABI38_0_0React-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI38_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI38_0_0YGOverflow, ABI38_0_0RCTShadowView) {
#pragma unused (json)
  view.overflow = ABI38_0_0YGOverflowScroll;
}

ABI38_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ABI38_0_0ReactTag
                  callback:(ABI38_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI38_0_0RCTScrollView *> *viewRegistry) {

    ABI38_0_0RCTScrollView *view = viewRegistry[ABI38_0_0ReactTag];
    if (!view || ![view isKindOfClass:[ABI38_0_0RCTScrollView class]]) {
      ABI38_0_0RCTLogError(@"Cannot find ABI38_0_0RCTScrollView with tag #%@", ABI38_0_0ReactTag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ABI38_0_0ReactTag
                  callback:(ABI38_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI38_0_0RCTScrollView *> *viewRegistry) {

    ABI38_0_0RCTScrollView *view = viewRegistry[ABI38_0_0ReactTag];
    if (!view || ![view isKindOfClass:[ABI38_0_0RCTScrollView class]]) {
      ABI38_0_0RCTLogError(@"Cannot find ABI38_0_0RCTScrollView with tag #%@", ABI38_0_0ReactTag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ABI38_0_0ReactTag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ABI38_0_0ReactTag];
    if ([view conformsToProtocol:@protocol(ABI38_0_0RCTScrollableProtocol)]) {
      [(id<ABI38_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI38_0_0RCTLogError(@"tried to scrollTo: on non-ABI38_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ABI38_0_0ReactTag);
    }
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(scrollToEnd:(nonnull NSNumber *)ABI38_0_0ReactTag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
     UIView *view = viewRegistry[ABI38_0_0ReactTag];
     if ([view conformsToProtocol:@protocol(ABI38_0_0RCTScrollableProtocol)]) {
       [(id<ABI38_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
     } else {
       ABI38_0_0RCTLogError(@"tried to scrollTo: on non-ABI38_0_0RCTScrollableProtocol view %@ "
                   "with tag #%@", view, ABI38_0_0ReactTag);
     }
   }];
}

ABI38_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ABI38_0_0ReactTag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ABI38_0_0ReactTag];
    if ([view conformsToProtocol:@protocol(ABI38_0_0RCTScrollableProtocol)]) {
      [(id<ABI38_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI38_0_0RCTLogError(@"tried to zoomToRect: on non-ABI38_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ABI38_0_0ReactTag);
    }
  }];
}

ABI38_0_0RCT_EXPORT_METHOD(flashScrollIndicators:(nonnull NSNumber *)ABI38_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI38_0_0RCTScrollView *> *viewRegistry){

     ABI38_0_0RCTScrollView *view = viewRegistry[ABI38_0_0ReactTag];
     if (!view || ![view isKindOfClass:[ABI38_0_0RCTScrollView class]]) {
       ABI38_0_0RCTLogError(@"Cannot find ABI38_0_0RCTScrollView with tag #%@", ABI38_0_0ReactTag);
       return;
     }

     [view.scrollView flashScrollIndicators];
   }];
}

@end
