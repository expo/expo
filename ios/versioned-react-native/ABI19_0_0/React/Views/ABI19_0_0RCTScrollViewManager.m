/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTScrollViewManager.h"

#import "ABI19_0_0RCTBridge.h"
#import "ABI19_0_0RCTScrollView.h"
#import "ABI19_0_0RCTShadowView.h"
#import "ABI19_0_0RCTUIManager.h"

@interface ABI19_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI19_0_0RCTConvert (UIScrollView)

ABI19_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI19_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

@end

@implementation ABI19_0_0RCTScrollViewManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI19_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
#if !TARGET_OS_TV
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
#endif
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollAnimationEnd, ABI19_0_0RCTDirectEventBlock)

// overflow is used both in css-layout as well as by ReactABI19_0_0-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
ABI19_0_0RCT_CUSTOM_SHADOW_PROPERTY(overflow, ABI19_0_0YGOverflow, ABI19_0_0RCTShadowView) {
#pragma unused (json)
  view.overflow = ABI19_0_0YGOverflowScroll;
}

ABI19_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI19_0_0Tag
                  callback:(ABI19_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI19_0_0RCTScrollView *> *viewRegistry) {

    ABI19_0_0RCTScrollView *view = viewRegistry[ReactABI19_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI19_0_0RCTScrollView class]]) {
      ABI19_0_0RCTLogError(@"Cannot find ABI19_0_0RCTScrollView with tag #%@", ReactABI19_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI19_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI19_0_0Tag
                  callback:(ABI19_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI19_0_0RCTScrollView *> *viewRegistry) {

    ABI19_0_0RCTScrollView *view = viewRegistry[ReactABI19_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI19_0_0RCTScrollView class]]) {
      ABI19_0_0RCTLogError(@"Cannot find ABI19_0_0RCTScrollView with tag #%@", ReactABI19_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI19_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI19_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI19_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI19_0_0RCTScrollableProtocol)]) {
      [(id<ABI19_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI19_0_0RCTLogError(@"tried to scrollTo: on non-ABI19_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI19_0_0Tag);
    }
  }];
}

ABI19_0_0RCT_EXPORT_METHOD(scrollToEnd:(nonnull NSNumber *)ReactABI19_0_0Tag
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
     UIView *view = viewRegistry[ReactABI19_0_0Tag];
     if ([view conformsToProtocol:@protocol(ABI19_0_0RCTScrollableProtocol)]) {
       [(id<ABI19_0_0RCTScrollableProtocol>)view scrollToEnd:animated];
     } else {
       ABI19_0_0RCTLogError(@"tried to scrollTo: on non-ABI19_0_0RCTScrollableProtocol view %@ "
                   "with tag #%@", view, ReactABI19_0_0Tag);
     }
   }];
}

ABI19_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI19_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI19_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI19_0_0RCTScrollableProtocol)]) {
      [(id<ABI19_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI19_0_0RCTLogError(@"tried to zoomToRect: on non-ABI19_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI19_0_0Tag);
    }
  }];
}

ABI19_0_0RCT_EXPORT_METHOD(flashScrollIndicators:(nonnull NSNumber *)ReactABI19_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI19_0_0RCTScrollView *> *viewRegistry){

     ABI19_0_0RCTScrollView *view = viewRegistry[ReactABI19_0_0Tag];
     if (!view || ![view isKindOfClass:[ABI19_0_0RCTScrollView class]]) {
       ABI19_0_0RCTLogError(@"Cannot find ABI19_0_0RCTScrollView with tag #%@", ReactABI19_0_0Tag);
       return;
     }

     [view.scrollView flashScrollIndicators];
   }];
}

@end
