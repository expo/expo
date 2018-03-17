/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTSurfaceRootShadowView.h"

#import "ABI26_0_0RCTI18nUtil.h"
#import "ABI26_0_0RCTShadowView+Layout.h"
#import "ABI26_0_0RCTUIManagerUtils.h"

@implementation ABI26_0_0RCTSurfaceRootShadowView {
  CGSize _intrinsicSize;
  BOOL _isRendered;
  BOOL _isLaidOut;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.viewName = @"ABI26_0_0RCTSurfaceRootView";
    _baseDirection = [[ABI26_0_0RCTI18nUtil sharedInstance] isRTL] ? ABI26_0_0YGDirectionRTL : ABI26_0_0YGDirectionLTR;
    _minimumSize = CGSizeZero;
    _maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

    self.alignSelf = ABI26_0_0YGAlignStretch;
    self.flex = 1;
  }

  return self;
}

- (void)insertReactABI26_0_0Subview:(ABI26_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI26_0_0Subview:subview atIndex:atIndex];
  if (!_isRendered) {
    [_delegate rootShadowViewDidStartRendering:self];
    _isRendered = YES;
  }
}

- (void)calculateLayoutWithMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  ABI26_0_0YGNodeRef yogaNode = self.yogaNode;

  ABI26_0_0YGNodeStyleSetMinWidth(yogaNode, ABI26_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
  ABI26_0_0YGNodeStyleSetMinHeight(yogaNode, ABI26_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));

  ABI26_0_0YGNodeCalculateLayout(
    self.yogaNode,
    ABI26_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width),
    ABI26_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height),
    _baseDirection
  );
}

- (NSSet<ABI26_0_0RCTShadowView *> *)collectViewsWithUpdatedFrames
{
  [self calculateLayoutWithMinimumSize:_minimumSize
                           maximumSize:_maximumSize];

  NSMutableSet<ABI26_0_0RCTShadowView *> *viewsWithNewFrame = [NSMutableSet set];
  [self applyLayoutNode:self.yogaNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:CGPointZero];

  self.intrinsicSize = self.frame.size;

  if (_isRendered && !_isLaidOut) {
    [_delegate rootShadowViewDidStartLayingOut:self];
    _isLaidOut = YES;
  }

  return viewsWithNewFrame;
}

- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  if (CGSizeEqualToSize(minimumSize, _minimumSize) &&
      CGSizeEqualToSize(maximumSize, _maximumSize)) {
    return;
  }

  _maximumSize = maximumSize;
  _minimumSize = minimumSize;
}

- (void)setIntrinsicSize:(CGSize)intrinsicSize
{
  if (CGSizeEqualToSize(_intrinsicSize, intrinsicSize)) {
    return;
  }

  _intrinsicSize = intrinsicSize;

  [_delegate rootShadowView:self didChangeIntrinsicSize:intrinsicSize];
}

- (CGSize)intrinsicSize
{
  return _intrinsicSize;
}

@end
