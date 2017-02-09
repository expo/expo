/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0RCTScrollViewManager.h"

#import "ABI14_0_0RCTBridge.h"
#import "ABI14_0_0RCTScrollView.h"
#import "ABI14_0_0RCTShadowView.h"
#import "ABI14_0_0RCTUIManager.h"

@interface ABI14_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI14_0_0RCTConvert (UIScrollView)

ABI14_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI14_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

@end

@implementation ABI14_0_0RCTScrollViewManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI14_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(stickyHeaderIndices, NSIndexSet)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollAnimationEnd, ABI14_0_0RCTDirectEventBlock)

// overflow is used both in css-layout as well as by ReactABI14_0_0-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI14_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI14_0_0YGOverflow, ABI14_0_0RCTShadowView) {
  view.overflow = ABI14_0_0YGOverflowScroll;
}

ABI14_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI14_0_0Tag
                  callback:(ABI14_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI14_0_0RCTScrollView *> *viewRegistry) {

    ABI14_0_0RCTScrollView *view = viewRegistry[ReactABI14_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI14_0_0RCTScrollView class]]) {
      ABI14_0_0RCTLogError(@"Cannot find ABI14_0_0RCTScrollView with tag #%@", ReactABI14_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI14_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI14_0_0Tag
                  callback:(ABI14_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI14_0_0RCTScrollView *> *viewRegistry) {

    ABI14_0_0RCTScrollView *view = viewRegistry[ReactABI14_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI14_0_0RCTScrollView class]]) {
      ABI14_0_0RCTLogError(@"Cannot find ABI14_0_0RCTScrollView with tag #%@", ReactABI14_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI14_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI14_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI14_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI14_0_0RCTScrollableProtocol)]) {
      [(id<ABI14_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI14_0_0RCTLogError(@"tried to scrollTo: on non-ABI14_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI14_0_0Tag);
    }
  }];
}

ABI14_0_0RCT_EXPORT_METHOD(scrollToEnd:(nonnull NSNumber *)ReactABI14_0_0Tag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
     UIView *view = viewRegistry[ReactABI14_0_0Tag];
     if ([view conformsToProtocol:@protocol(ABI14_0_0RCTScrollableProtocol)]) {
       [(id<ABI14_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
     } else {
       ABI14_0_0RCTLogError(@"tried to scrollTo: on non-ABI14_0_0RCTScrollableProtocol view %@ "
                   "with tag #%@", view, ReactABI14_0_0Tag);
     }
   }];
}

ABI14_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI14_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI14_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI14_0_0RCTScrollableProtocol)]) {
      [(id<ABI14_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI14_0_0RCTLogError(@"tried to zoomToRect: on non-ABI14_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI14_0_0Tag);
    }
  }];
}

@end
