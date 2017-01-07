/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTI18nUtil.h"
#import "ABI13_0_0RCTRootShadowView.h"

@implementation ABI13_0_0RCTRootShadowView

/**
 * Init the ABI13_0_0RCTRootShadowView with RTL status.
 * Returns a RTL CSS layout if isRTL is true (Default is LTR CSS layout).
 */
- (instancetype)init
{
  self = [super init];
  if (self) {
    if ([[ABI13_0_0RCTI18nUtil sharedInstance] isRTL]) {
      ABI13_0_0YGNodeStyleSetDirection(self.cssNode, ABI13_0_0YGDirectionRTL);
    }
  }
  return self;
}

- (void)applySizeConstraints
{
  switch (_sizeFlexibility) {
    case ABI13_0_0RCTRootViewSizeFlexibilityNone:
      break;
    case ABI13_0_0RCTRootViewSizeFlexibilityWidth:
      ABI13_0_0YGNodeStyleSetWidth(self.cssNode, ABI13_0_0YGUndefined);
      break;
    case ABI13_0_0RCTRootViewSizeFlexibilityHeight:
      ABI13_0_0YGNodeStyleSetHeight(self.cssNode, ABI13_0_0YGUndefined);
      break;
    case ABI13_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      ABI13_0_0YGNodeStyleSetWidth(self.cssNode, ABI13_0_0YGUndefined);
      ABI13_0_0YGNodeStyleSetHeight(self.cssNode, ABI13_0_0YGUndefined);
      break;
  }
}

- (NSSet<ABI13_0_0RCTShadowView *> *)collectViewsWithUpdatedFrames
{
  [self applySizeConstraints];

  ABI13_0_0YGNodeCalculateLayout(self.cssNode, ABI13_0_0YGUndefined, ABI13_0_0YGUndefined, ABI13_0_0YGDirectionInherit);

  NSMutableSet<ABI13_0_0RCTShadowView *> *viewsWithNewFrame = [NSMutableSet set];
  [self applyLayoutNode:self.cssNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:CGPointZero];
  return viewsWithNewFrame;
}

@end
