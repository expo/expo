/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTScrollViewManager.h"

#import "ABI7_0_0RCTBridge.h"
#import "ABI7_0_0RCTScrollView.h"
#import "ABI7_0_0RCTUIManager.h"

@interface ABI7_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI7_0_0RCTConvert (UIScrollView)

ABI7_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI7_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

@end

@implementation ABI7_0_0RCTScrollViewManager

ABI7_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI7_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(stickyHeaderIndices, NSIndexSet)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onRefreshStart, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollAnimationEnd, ABI7_0_0RCTDirectEventBlock)

ABI7_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI7_0_0Tag
                  callback:(ABI7_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI7_0_0RCTScrollView *> *viewRegistry) {

    ABI7_0_0RCTScrollView *view = viewRegistry[ReactABI7_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI7_0_0RCTScrollView class]]) {
      ABI7_0_0RCTLogError(@"Cannot find ABI7_0_0RCTScrollView with tag #%@", ReactABI7_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI7_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI7_0_0Tag
                  callback:(ABI7_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI7_0_0RCTScrollView *> *viewRegistry) {

    ABI7_0_0RCTScrollView *view = viewRegistry[ReactABI7_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI7_0_0RCTScrollView class]]) {
      ABI7_0_0RCTLogError(@"Cannot find ABI7_0_0RCTScrollView with tag #%@", ReactABI7_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI7_0_0RCT_EXPORT_METHOD(endRefreshing:(nonnull NSNumber *)ReactABI7_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI7_0_0RCTScrollView *> *viewRegistry) {

    ABI7_0_0RCTScrollView *view = viewRegistry[ReactABI7_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI7_0_0RCTScrollView class]]) {
      ABI7_0_0RCTLogError(@"Cannot find ABI7_0_0RCTScrollView with tag #%@", ReactABI7_0_0Tag);
      return;
    }

    [view endRefreshing];
  }];
}

ABI7_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI7_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI7_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI7_0_0RCTScrollableProtocol)]) {
      [(id<ABI7_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI7_0_0RCTLogError(@"tried to scrollTo: on non-ABI7_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI7_0_0Tag);
    }
  }];
}

ABI7_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI7_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI7_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI7_0_0RCTScrollableProtocol)]) {
      [(id<ABI7_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI7_0_0RCTLogError(@"tried to zoomToRect: on non-ABI7_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI7_0_0Tag);
    }
  }];
}

@end
