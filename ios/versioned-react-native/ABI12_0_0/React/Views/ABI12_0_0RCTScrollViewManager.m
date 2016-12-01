/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTScrollViewManager.h"

#import "ABI12_0_0RCTBridge.h"
#import "ABI12_0_0RCTScrollView.h"
#import "ABI12_0_0RCTShadowView.h"
#import "ABI12_0_0RCTUIManager.h"

@interface ABI12_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI12_0_0RCTConvert (UIScrollView)

ABI12_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI12_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

@end

@implementation ABI12_0_0RCTScrollViewManager

ABI12_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI12_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(stickyHeaderIndices, NSIndexSet)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollAnimationEnd, ABI12_0_0RCTDirectEventBlock)

// overflow is used both in css-layout as well as by reac-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI12_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI12_0_0CSSOverflow, ABI12_0_0RCTShadowView) {
  view.overflow = ABI12_0_0CSSOverflowScroll;
}

ABI12_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI12_0_0Tag
                  callback:(ABI12_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI12_0_0RCTScrollView *> *viewRegistry) {

    ABI12_0_0RCTScrollView *view = viewRegistry[ReactABI12_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI12_0_0RCTScrollView class]]) {
      ABI12_0_0RCTLogError(@"Cannot find ABI12_0_0RCTScrollView with tag #%@", ReactABI12_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI12_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI12_0_0Tag
                  callback:(ABI12_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI12_0_0RCTScrollView *> *viewRegistry) {

    ABI12_0_0RCTScrollView *view = viewRegistry[ReactABI12_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI12_0_0RCTScrollView class]]) {
      ABI12_0_0RCTLogError(@"Cannot find ABI12_0_0RCTScrollView with tag #%@", ReactABI12_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI12_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI12_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI12_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI12_0_0RCTScrollableProtocol)]) {
      [(id<ABI12_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI12_0_0RCTLogError(@"tried to scrollTo: on non-ABI12_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI12_0_0Tag);
    }
  }];
}

ABI12_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI12_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI12_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI12_0_0RCTScrollableProtocol)]) {
      [(id<ABI12_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI12_0_0RCTLogError(@"tried to zoomToRect: on non-ABI12_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI12_0_0Tag);
    }
  }];
}

@end
