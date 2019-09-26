/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTScrollViewManager.h"

#import "ABI34_0_0RCTBridge.h"
#import "ABI34_0_0RCTScrollView.h"
#import "ABI34_0_0RCTShadowView.h"
#import "ABI34_0_0RCTUIManager.h"

@interface ABI34_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI34_0_0RCTConvert (UIScrollView)

ABI34_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI34_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI34_0_0RCT_ENUM_CONVERTER(UIScrollViewContentInsetAdjustmentBehavior, (@{
  @"automatic": @(UIScrollViewContentInsetAdjustmentAutomatic),
  @"scrollableAxes": @(UIScrollViewContentInsetAdjustmentScrollableAxes),
  @"never": @(UIScrollViewContentInsetAdjustmentNever),
  @"always": @(UIScrollViewContentInsetAdjustmentAlways),
}), UIScrollViewContentInsetAdjustmentNever, integerValue)
#endif

@end

@implementation ABI34_0_0RCTScrollViewManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI34_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maintainVisibleContentPosition, NSDictionary)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(pinchGestureEnabled, scrollView.pinchGestureEnabled, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(scrollToOverflowEnabled, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(snapToOffsets, NSArray<NSNumber *>)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(snapToStart, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(snapToEnd, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollToTop, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(DEPRECATED_sendUpdatedChildFrames, BOOL)
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)
#endif

// overflow is used both in css-layout as well as by ReactABI34_0_0-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI34_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI34_0_0YGOverflow, ABI34_0_0RCTShadowView) {
#pragma unused (json)
  view.overflow = ABI34_0_0YGOverflowScroll;
}

ABI34_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI34_0_0Tag
                  callback:(ABI34_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI34_0_0RCTScrollView *> *viewRegistry) {

    ABI34_0_0RCTScrollView *view = viewRegistry[ReactABI34_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI34_0_0RCTScrollView class]]) {
      ABI34_0_0RCTLogError(@"Cannot find ABI34_0_0RCTScrollView with tag #%@", ReactABI34_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI34_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI34_0_0Tag
                  callback:(ABI34_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI34_0_0RCTScrollView *> *viewRegistry) {

    ABI34_0_0RCTScrollView *view = viewRegistry[ReactABI34_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI34_0_0RCTScrollView class]]) {
      ABI34_0_0RCTLogError(@"Cannot find ABI34_0_0RCTScrollView with tag #%@", ReactABI34_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI34_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI34_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI34_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI34_0_0RCTScrollableProtocol)]) {
      [(id<ABI34_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI34_0_0RCTLogError(@"tried to scrollTo: on non-ABI34_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI34_0_0Tag);
    }
  }];
}

ABI34_0_0RCT_EXPORT_METHOD(scrollToEnd:(nonnull NSNumber *)ReactABI34_0_0Tag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
     UIView *view = viewRegistry[ReactABI34_0_0Tag];
     if ([view conformsToProtocol:@protocol(ABI34_0_0RCTScrollableProtocol)]) {
       [(id<ABI34_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
     } else {
       ABI34_0_0RCTLogError(@"tried to scrollTo: on non-ABI34_0_0RCTScrollableProtocol view %@ "
                   "with tag #%@", view, ReactABI34_0_0Tag);
     }
   }];
}

ABI34_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI34_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI34_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI34_0_0RCTScrollableProtocol)]) {
      [(id<ABI34_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI34_0_0RCTLogError(@"tried to zoomToRect: on non-ABI34_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI34_0_0Tag);
    }
  }];
}

ABI34_0_0RCT_EXPORT_METHOD(flashScrollIndicators:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI34_0_0RCTScrollView *> *viewRegistry){

     ABI34_0_0RCTScrollView *view = viewRegistry[ReactABI34_0_0Tag];
     if (!view || ![view isKindOfClass:[ABI34_0_0RCTScrollView class]]) {
       ABI34_0_0RCTLogError(@"Cannot find ABI34_0_0RCTScrollView with tag #%@", ReactABI34_0_0Tag);
       return;
     }

     [view.scrollView flashScrollIndicators];
   }];
}

@end
