/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTSurfaceRootShadowView.h"

#import <ReactABI25_0_0/ABI25_0_0RCTUIManagerUtils.h>

#import "ABI25_0_0RCTI18nUtil.h"

@implementation ABI25_0_0RCTSurfaceRootShadowView {
  CGSize _intrinsicSize;
  BOOL _isRendered;
  BOOL _isLaidOut;
}

- (instancetype)init
{
  if (self = [super init]) {
    self.viewName = @"ABI25_0_0RCTSurfaceRootView";
    _baseDirection = [[ABI25_0_0RCTI18nUtil sharedInstance] isRTL] ? ABI25_0_0YGDirectionRTL : ABI25_0_0YGDirectionLTR;
    _minimumSize = CGSizeZero;
    _maximumSize = CGSizeMake(INFINITY, INFINITY);

    self.alignSelf = ABI25_0_0YGAlignStretch;
    self.flex = 1;
  }

  return self;
}

- (void)insertReactABI25_0_0Subview:(ABI25_0_0RCTShadowView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI25_0_0Subview:subview atIndex:atIndex];
  if (!_isRendered) {
    [_delegate rootShadowViewDidStartRendering:self];
    _isRendered = YES;
  }
}

- (void)calculateLayoutWithMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximimSize
{
  // Treating `INFINITY` as `ABI25_0_0YGUndefined` (which equals `NAN`).
  float availableWidth = isinf(maximimSize.width) ? ABI25_0_0YGUndefined : maximimSize.width;
  float availableHeight = isinf(maximimSize.height) ? ABI25_0_0YGUndefined : maximimSize.height;

  self.minWidth = (ABI25_0_0YGValue){isinf(minimumSize.width) ? ABI25_0_0YGUndefined : minimumSize.width, ABI25_0_0YGUnitPoint};
  self.minWidth = (ABI25_0_0YGValue){isinf(minimumSize.height) ? ABI25_0_0YGUndefined : minimumSize.height, ABI25_0_0YGUnitPoint};

  ABI25_0_0YGNodeCalculateLayout(self.yogaNode, availableWidth, availableHeight, _baseDirection);
}

- (NSSet<ABI25_0_0RCTShadowView *> *)collectViewsWithUpdatedFrames
{
  [self calculateLayoutWithMinimumSize:_minimumSize
                           maximumSize:_maximumSize];

  NSMutableSet<ABI25_0_0RCTShadowView *> *viewsWithNewFrame = [NSMutableSet set];
  [self applyLayoutNode:self.yogaNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:CGPointZero];

  self.intrinsicSize = self.frame.size;

  if (_isRendered && !_isLaidOut) {
    [_delegate rootShadowViewDidStartLayingOut:self];
    _isLaidOut = YES;
  }

  return viewsWithNewFrame;
}

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
{
  // Positive case where requested constraind are aready enforced.
  if (CGSizeEqualToSize(minimumSize, _minimumSize) &&
      CGSizeEqualToSize(maximumSize, _maximumSize)) {
    // We stil need to call `calculateLayoutWithMinimumSize:maximumSize`
    // mehtod though.
    [self calculateLayoutWithMinimumSize:_minimumSize
                             maximumSize:_maximumSize];

    ABI25_0_0YGNodeRef yogaNode = self.yogaNode;
    return CGSizeMake(ABI25_0_0YGNodeLayoutGetWidth(yogaNode), ABI25_0_0YGNodeLayoutGetHeight(yogaNode));
  }

  // Generic case, where requested constraind are different from enforced.

  // Applying given size constraints.
  [self calculateLayoutWithMinimumSize:minimumSize
                           maximumSize:maximumSize];

  ABI25_0_0YGNodeRef yogaNode = self.yogaNode;
  CGSize fittingSize =
    CGSizeMake(ABI25_0_0YGNodeLayoutGetWidth(yogaNode), ABI25_0_0YGNodeLayoutGetHeight(yogaNode));

  // Reverting size constraints.
  [self calculateLayoutWithMinimumSize:_minimumSize
                           maximumSize:_maximumSize];

  return CGSizeMake(
    MAX(minimumSize.width, MIN(maximumSize.width, fittingSize.width)),
    MAX(minimumSize.height, MIN(maximumSize.height, fittingSize.height))
  );
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
