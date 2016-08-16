/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTScrollViewManager.h"

#import "ABI8_0_0RCTBridge.h"
#import "ABI8_0_0RCTScrollView.h"
#import "ABI8_0_0RCTUIManager.h"

@interface ABI8_0_0RCTScrollView (Private)

- (NSArray<NSDictionary *> *)calculateChildFramesData;

@end

@implementation ABI8_0_0RCTConvert (UIScrollView)

ABI8_0_0RCT_ENUM_CONVERTER(UIScrollViewKeyboardDismissMode, (@{
  @"none": @(UIScrollViewKeyboardDismissModeNone),
  @"on-drag": @(UIScrollViewKeyboardDismissModeOnDrag),
  @"interactive": @(UIScrollViewKeyboardDismissModeInteractive),
  // Backwards compatibility
  @"onDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
}), UIScrollViewKeyboardDismissModeNone, integerValue)

ABI8_0_0RCT_ENUM_CONVERTER(UIScrollViewIndicatorStyle, (@{
  @"default": @(UIScrollViewIndicatorStyleDefault),
  @"black": @(UIScrollViewIndicatorStyleBlack),
  @"white": @(UIScrollViewIndicatorStyleWhite),
}), UIScrollViewIndicatorStyleDefault, integerValue)

@end

@implementation ABI8_0_0RCTScrollViewManager

ABI8_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI8_0_0RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(stickyHeaderIndices, NSIndexSet)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, ABI8_0_0RCTDirectEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI8_0_0RCTDirectEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, ABI8_0_0RCTDirectEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, ABI8_0_0RCTDirectEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, ABI8_0_0RCTDirectEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onScrollAnimationEnd, ABI8_0_0RCTDirectEventBlock)

ABI8_0_0RCT_EXPORT_METHOD(getContentSize:(nonnull NSNumber *)ReactABI8_0_0Tag
                  callback:(ABI8_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI8_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI8_0_0RCTScrollView *> *viewRegistry) {

    ABI8_0_0RCTScrollView *view = viewRegistry[ReactABI8_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI8_0_0RCTScrollView class]]) {
      ABI8_0_0RCTLogError(@"Cannot find ABI8_0_0RCTScrollView with tag #%@", ReactABI8_0_0Tag);
      return;
    }

    CGSize size = view.scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

ABI8_0_0RCT_EXPORT_METHOD(calculateChildFrames:(nonnull NSNumber *)ReactABI8_0_0Tag
                  callback:(ABI8_0_0RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI8_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI8_0_0RCTScrollView *> *viewRegistry) {

    ABI8_0_0RCTScrollView *view = viewRegistry[ReactABI8_0_0Tag];
    if (!view || ![view isKindOfClass:[ABI8_0_0RCTScrollView class]]) {
      ABI8_0_0RCTLogError(@"Cannot find ABI8_0_0RCTScrollView with tag #%@", ReactABI8_0_0Tag);
      return;
    }

    NSArray<NSDictionary *> *childFrames = [view calculateChildFramesData];
    if (childFrames) {
      callback(@[childFrames]);
    }
  }];
}

ABI8_0_0RCT_EXPORT_METHOD(scrollTo:(nonnull NSNumber *)ReactABI8_0_0Tag
                  offsetX:(CGFloat)x
                  offsetY:(CGFloat)y
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI8_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI8_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI8_0_0RCTScrollableProtocol)]) {
      [(id<ABI8_0_0RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
    } else {
      ABI8_0_0RCTLogError(@"tried to scrollTo: on non-ABI8_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI8_0_0Tag);
    }
  }];
}

ABI8_0_0RCT_EXPORT_METHOD(zoomToRect:(nonnull NSNumber *)ReactABI8_0_0Tag
                  withRect:(CGRect)rect
                  animated:(BOOL)animated)
{
  [self.bridge.uiManager addUIBlock:
   ^(__unused ABI8_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry){
    UIView *view = viewRegistry[ReactABI8_0_0Tag];
    if ([view conformsToProtocol:@protocol(ABI8_0_0RCTScrollableProtocol)]) {
      [(id<ABI8_0_0RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
    } else {
      ABI8_0_0RCTLogError(@"tried to zoomToRect: on non-ABI8_0_0RCTScrollableProtocol view %@ "
                  "with tag #%@", view, ReactABI8_0_0Tag);
    }
  }];
}

@end
