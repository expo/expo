/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTScrollViewManager.h"

#import "ABI10_0_0RCTBridge.h"
#import "ABI10_0_0RCTScrollView.h"
#import "ABI10_0_0RCTUIManager.h"

@interface ABI10_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI10_0_0RCTConvert (UIScrollView)

ABI10_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI10_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

@end

@implementation ABI10_0_0RCTScrollViewManager

ABI10_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI10_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(stickyHeaderIndices, NSIndexSet)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI10_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI10_0_0RCTDirectEventBlock)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI10_0_0RCTDirectEventBlock)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI10_0_0RCTDirectEventBlock)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI10_0_0RCTDirectEventBlock)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI10_0_0RCTDirectEventBlock)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollAnimationEnd, ABI10_0_0RCTDirectEventBlock)

ABI10_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI10_0_0Tag
                  callback:(ABI10_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI10_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI10_0_0RCTScrollView *> *viewRegistry) {

    ABI10_0_0RCTScrollView *view = viewRegistry[ReactABI10_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI10_0_0RCTScrollView class]]) {
      ABI10_0_0RCTLogError(@"Cannot find ABI10_0_0RCTScrollView with tag #%@", ReactABI10_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI10_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI10_0_0Tag
                  callback:(ABI10_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI10_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI10_0_0RCTScrollView *> *viewRegistry) {

    ABI10_0_0RCTScrollView *view = viewRegistry[ReactABI10_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI10_0_0RCTScrollView class]]) {
      ABI10_0_0RCTLogError(@"Cannot find ABI10_0_0RCTScrollView with tag #%@", ReactABI10_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI10_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI10_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI10_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI10_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI10_0_0RCTScrollableProtocol)]) {
      [(id<ABI10_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI10_0_0RCTLogError(@"tried to scrollTo: on non-ABI10_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI10_0_0Tag);
    }
  }];
}

ABI10_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI10_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI10_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI10_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI10_0_0RCTScrollableProtocol)]) {
      [(id<ABI10_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI10_0_0RCTLogError(@"tried to zoomToRect: on non-ABI10_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI10_0_0Tag);
    }
  }];
}

@end
