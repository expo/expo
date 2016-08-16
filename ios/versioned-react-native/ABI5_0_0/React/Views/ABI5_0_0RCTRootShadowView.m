/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTRootShadowView.h"

@implementation ABI5_0_0RCTRootShadowView

- (void)applySizeConstraints
{
  switch (_sizeFlexibility) {
    case ABI5_0_0RCTRootViewSizeFlexibilityNone:
      break;
    case ABI5_0_0RCTRootViewSizeFlexibilityWidth:
      self.cssNode->style.dimensions[CSS_WIDTH] = CSS_UNDEFINED;
      break;
    case ABI5_0_0RCTRootViewSizeFlexibilityHeight:
      self.cssNode->style.dimensions[CSS_HEIGHT] = CSS_UNDEFINED;
      break;
    case ABI5_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      self.cssNode->style.dimensions[CSS_WIDTH] = CSS_UNDEFINED;
      self.cssNode->style.dimensions[CSS_HEIGHT] = CSS_UNDEFINED;
      break;
  }
}

- (NSSet<ABI5_0_0RCTShadowView *> *)collectViewsWithUpdatedFrames
{
  [self applySizeConstraints];

  [self fillCSSNode:self.cssNode];
  resetNodeLayout(self.cssNode);
  layoutNode(self.cssNode, CSS_UNDEFINED, CSS_UNDEFINED, CSS_DIRECTION_INHERIT);

  NSMutableSet<ABI5_0_0RCTShadowView *> *viewsWithNewFrame = [NSMutableSet set];
  [self applyLayoutNode:self.cssNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:CGPointZero];
  return viewsWithNewFrame;
}

@end
