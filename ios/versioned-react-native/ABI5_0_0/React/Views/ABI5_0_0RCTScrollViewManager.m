/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTScrollViewManager.h"

#import "ABI5_0_0RCTBridge.h"
#import "ABI5_0_0RCTScrollView.h"
#import "ABI5_0_0RCTUIManager.h"

@interface ABI5_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI5_0_0RCTConvert (UIScrollView)

ABI5_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI5_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

@end

@implementation ABI5_0_0RCTScrollViewManager

ABI5_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI5_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(stickyHeaderIndices, NSIndexSet)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onRefreshStart, ABI5_0_0RCTDirectEventBlock)

ABI5_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI5_0_0Tag
                  callback:(ABI5_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI5_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI5_0_0RCTScrollView *> *viewRegistry) {

    ABI5_0_0RCTScrollView *view = viewRegistry[ReactABI5_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI5_0_0RCTScrollView class]]) {
      ABI5_0_0RCTLogError(@"Cannot find ABI5_0_0RCTScrollView with tag #%@", ReactABI5_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI5_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI5_0_0Tag
                  callback:(ABI5_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI5_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI5_0_0RCTScrollView *> *viewRegistry) {

    ABI5_0_0RCTScrollView *view = viewRegistry[ReactABI5_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI5_0_0RCTScrollView class]]) {
      ABI5_0_0RCTLogError(@"Cannot find ABI5_0_0RCTScrollView with tag #%@", ReactABI5_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI5_0_0RCT_EXPORT_METHOD(endRefreshing:(nonnull NSNumber *)ReactABI5_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI5_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI5_0_0RCTScrollView *> *viewRegistry) {

    ABI5_0_0RCTScrollView *view = viewRegistry[ReactABI5_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI5_0_0RCTScrollView class]]) {
      ABI5_0_0RCTLogError(@"Cannot find ABI5_0_0RCTScrollView with tag #%@", ReactABI5_0_0Tag);
      return;
    }

    [view endRefreshing];
  }];
}

ABI5_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI5_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI5_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI5_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI5_0_0RCTScrollableProtocol)]) {
      [(id<ABI5_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI5_0_0RCTLogError(@"tried to scrollTo: on non-ABI5_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI5_0_0Tag);
    }
  }];
}

ABI5_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI5_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI5_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI5_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI5_0_0RCTScrollableProtocol)]) {
      [(id<ABI5_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI5_0_0RCTLogError(@"tried to zoomToRect: on non-ABI5_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI5_0_0Tag);
    }
  }];
}

- (NSArray<NSString *> *)customDirectEventTypes
{
  return @[
    @"scrollBeginDrag",
    @"scroll",
    @"scrollEndDrag",
    @"scrollAnimationEnd",
    @"momentumScrollBegin",
    @"momentumScrollEnd",
  ];
}

@end
