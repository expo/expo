/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTScrollViewManager.h"

#import "ABI13_0_0RCTBridge.h"
#import "ABI13_0_0RCTScrollView.h"
#import "ABI13_0_0RCTShadowView.h"
#import "ABI13_0_0RCTUIManager.h"

@interface ABI13_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI13_0_0RCTConvert (UIScrollView)

ABI13_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI13_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

@end

@implementation ABI13_0_0RCTScrollViewManager

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI13_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(stickyHeaderIndices, NSIndexSet)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollAnimationEnd, ABI13_0_0RCTDirectEventBlock)

// overflow is used both in css-layout as well as by ReactABI13_0_0-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI13_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI13_0_0YGOverflow, ABI13_0_0RCTShadowView) {
  view.overflow = ABI13_0_0YGOverflowScroll;
}

ABI13_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI13_0_0Tag
                  callback:(ABI13_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI13_0_0RCTScrollView *> *viewRegistry) {

    ABI13_0_0RCTScrollView *view = viewRegistry[ReactABI13_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI13_0_0RCTScrollView class]]) {
      ABI13_0_0RCTLogError(@"Cannot find ABI13_0_0RCTScrollView with tag #%@", ReactABI13_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI13_0_0Tag
                  callback:(ABI13_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI13_0_0RCTScrollView *> *viewRegistry) {

    ABI13_0_0RCTScrollView *view = viewRegistry[ReactABI13_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI13_0_0RCTScrollView class]]) {
      ABI13_0_0RCTLogError(@"Cannot find ABI13_0_0RCTScrollView with tag #%@", ReactABI13_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI13_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI13_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI13_0_0RCTScrollableProtocol)]) {
      [(id<ABI13_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI13_0_0RCTLogError(@"tried to scrollTo: on non-ABI13_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI13_0_0Tag);
    }
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI13_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI13_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI13_0_0RCTScrollableProtocol)]) {
      [(id<ABI13_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI13_0_0RCTLogError(@"tried to zoomToRect: on non-ABI13_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI13_0_0Tag);
    }
  }];
}

@end
