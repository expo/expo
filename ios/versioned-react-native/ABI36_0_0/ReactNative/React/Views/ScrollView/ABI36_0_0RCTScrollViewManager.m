/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RCTScrollViewManager.h"

#import "ABI36_0_0RCTBridge.h"
#import "ABI36_0_0RCTScrollView.h"
#import "ABI36_0_0RCTShadowView.h"
#import "ABI36_0_0RCTUIManager.h"

@interface ABI36_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI36_0_0RCTConvert (UIScrollView)

ABI36_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI36_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI36_0_0RCT_ENUM_CONVERTER(UIScrollViewContentInsetAdjustmentBehavior, (@{
  @"automatic": @(UIScrollViewContentInsetAdjustmentAutomatic),
  @"scrollableAxes": @(UIScrollViewContentInsetAdjustmentScrollableAxes),
  @"never": @(UIScrollViewContentInsetAdjustmentNever),
  @"always": @(UIScrollViewContentInsetAdjustmentAlways),
}), UIScrollViewContentInsetAdjustmentNever, integerValue)
#endif
#pragma clang diagnostic pop

@end

@implementation ABI36_0_0RCTScrollViewManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI36_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maintainVisibleContentPosition, NSDictionary)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(pinchGestureEnabled, scrollView.pinchGestureEnabled, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(scrollToOverflowEnabled, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(disableIntervalMomentum, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(snapToOffsets, NSArray<NSNumber *>)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(snapToStart, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(snapToEnd, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollToTop, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(DEPRECATED_sendUpdatedChildFrames, BOOL)
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)
#endif

// overflow is used both in css-layout as well as by ABI36_0_0React-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI36_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI36_0_0YGOverflow, ABI36_0_0RCTShadowView) {
#pragma unused (json)
  view.overflow = ABI36_0_0YGOverflowScroll;
}

ABI36_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ABI36_0_0ReactTag
                  callback:(ABI36_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI36_0_0RCTScrollView *> *viewRegistry) {

    ABI36_0_0RCTScrollView *view = viewRegistry[ABI36_0_0ReactTag];
    if (!view || ![view isKindOfClass:[ABI36_0_0RCTScrollView class]]) {
      ABI36_0_0RCTLogError(@"Cannot find ABI36_0_0RCTScrollView with tag #%@", ABI36_0_0ReactTag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI36_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ABI36_0_0ReactTag
                  callback:(ABI36_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI36_0_0RCTScrollView *> *viewRegistry) {

    ABI36_0_0RCTScrollView *view = viewRegistry[ABI36_0_0ReactTag];
    if (!view || ![view isKindOfClass:[ABI36_0_0RCTScrollView class]]) {
      ABI36_0_0RCTLogError(@"Cannot find ABI36_0_0RCTScrollView with tag #%@", ABI36_0_0ReactTag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI36_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ABI36_0_0ReactTag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ABI36_0_0ReactTag];
    if ([view conformsToProtocol:@protocol(ABI36_0_0RCTScrollableProtocol)]) {
      [(id<ABI36_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI36_0_0RCTLogError(@"tried to scrollTo: on non-ABI36_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ABI36_0_0ReactTag);
    }
  }];
}

ABI36_0_0RCT_EXPORT_METHOD(scrollToEnd:(nonnull NSNumber *)ABI36_0_0ReactTag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
     UIView *view = viewRegistry[ABI36_0_0ReactTag];
     if ([view conformsToProtocol:@protocol(ABI36_0_0RCTScrollableProtocol)]) {
       [(id<ABI36_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
     } else {
       ABI36_0_0RCTLogError(@"tried to scrollTo: on non-ABI36_0_0RCTScrollableProtocol view %@ "
                   "with tag #%@", view, ABI36_0_0ReactTag);
     }
   }];
}

ABI36_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ABI36_0_0ReactTag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ABI36_0_0ReactTag];
    if ([view conformsToProtocol:@protocol(ABI36_0_0RCTScrollableProtocol)]) {
      [(id<ABI36_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI36_0_0RCTLogError(@"tried to zoomToRect: on non-ABI36_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ABI36_0_0ReactTag);
    }
  }];
}

ABI36_0_0RCT_EXPORT_METHOD(flashScrollIndicators:(nonnull NSNumber *)ABI36_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI36_0_0RCTScrollView *> *viewRegistry){

     ABI36_0_0RCTScrollView *view = viewRegistry[ABI36_0_0ReactTag];
     if (!view || ![view isKindOfClass:[ABI36_0_0RCTScrollView class]]) {
       ABI36_0_0RCTLogError(@"Cannot find ABI36_0_0RCTScrollView with tag #%@", ABI36_0_0ReactTag);
       return;
     }

     [view.scrollView flashScrollIndicators];
   }];
}

@end
