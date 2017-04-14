/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTScrollViewManager.h"

#import "ABI16_0_0RCTBridge.h"
#import "ABI16_0_0RCTScrollView.h"
#import "ABI16_0_0RCTShadowView.h"
#import "ABI16_0_0RCTUIManager.h"

@interface ABI16_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI16_0_0RCTConvert (UIScrollView)

ABI16_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI16_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

@end

@implementation ABI16_0_0RCTScrollViewManager

ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI16_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(stickyHeaderIndices, NSIndexSet)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollAnimationEnd, ABI16_0_0RCTDirectEventBlock)

// overflow is used both in css-layout as well as by ReactABI16_0_0-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI16_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI16_0_0YGOverflow, ABI16_0_0RCTShadowView) {
#pragma unused (json)
  view.overflow = ABI16_0_0YGOverflowScroll;
}

ABI16_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI16_0_0Tag
                  callback:(ABI16_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI16_0_0RCTScrollView *> *viewRegistry) {

    ABI16_0_0RCTScrollView *view = viewRegistry[ReactABI16_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI16_0_0RCTScrollView class]]) {
      ABI16_0_0RCTLogError(@"Cannot find ABI16_0_0RCTScrollView with tag #%@", ReactABI16_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI16_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI16_0_0Tag
                  callback:(ABI16_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI16_0_0RCTScrollView *> *viewRegistry) {

    ABI16_0_0RCTScrollView *view = viewRegistry[ReactABI16_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI16_0_0RCTScrollView class]]) {
      ABI16_0_0RCTLogError(@"Cannot find ABI16_0_0RCTScrollView with tag #%@", ReactABI16_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI16_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI16_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI16_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI16_0_0RCTScrollableProtocol)]) {
      [(id<ABI16_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI16_0_0RCTLogError(@"tried to scrollTo: on non-ABI16_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI16_0_0Tag);
    }
  }];
}

ABI16_0_0RCT_EXPORT_METHOD(scrollToEnd:(nonnull NSNumber *)ReactABI16_0_0Tag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
     UIView *view = viewRegistry[ReactABI16_0_0Tag];
     if ([view conformsToProtocol:@protocol(ABI16_0_0RCTScrollableProtocol)]) {
       [(id<ABI16_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
     } else {
       ABI16_0_0RCTLogError(@"tried to scrollTo: on non-ABI16_0_0RCTScrollableProtocol view %@ "
                   "with tag #%@", view, ReactABI16_0_0Tag);
     }
   }];
}

ABI16_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI16_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI16_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI16_0_0RCTScrollableProtocol)]) {
      [(id<ABI16_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI16_0_0RCTLogError(@"tried to zoomToRect: on non-ABI16_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI16_0_0Tag);
    }
  }];
}

@end
