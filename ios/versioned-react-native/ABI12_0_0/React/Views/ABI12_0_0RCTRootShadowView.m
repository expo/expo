/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTI18nUtil.h"
#import "ABI12_0_0RCTRootShadowView.h"

@implementation ABI12_0_0RCTRootShadowView

/**
 * Init the ABI12_0_0RCTRootShadowView with RTL status.
 * Returns a RTL ABI12_0_0CSS layout if isRTL is true (Default is LTR ABI12_0_0CSS layout).
 */
- (instancetype)init
{
  self = [super init];
  if (self) {
    if ([[ABI12_0_0RCTI18nUtil sharedInstance] isRTL]) {
      ABI12_0_0CSSNodeStyleSetDirection(self.cssNode, ABI12_0_0CSSDirectionRTL);
    }
  }
  return self;
}

- (void)applySizeConstraints
{
  switch (_sizeFlexibility) {
    case ABI12_0_0RCTRootViewSizeFlexibilityNone:
      break;
    case ABI12_0_0RCTRootViewSizeFlexibilityWidth:
      ABI12_0_0CSSNodeStyleSetWidth(self.cssNode, ABI12_0_0CSSUndefined);
      break;
    case ABI12_0_0RCTRootViewSizeFlexibilityHeight:
      ABI12_0_0CSSNodeStyleSetHeight(self.cssNode, ABI12_0_0CSSUndefined);
      break;
    case ABI12_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      ABI12_0_0CSSNodeStyleSetWidth(self.cssNode, ABI12_0_0CSSUndefined);
      ABI12_0_0CSSNodeStyleSetHeight(self.cssNode, ABI12_0_0CSSUndefined);
      break;
  }
}

- (NSSet<ABI12_0_0RCTShadowView *> *)collectViewsWithUpdatedFrames
{
  [self applySizeConstraints];

  ABI12_0_0CSSNodeCalculateLayout(self.cssNode, ABI12_0_0CSSUndefined, ABI12_0_0CSSUndefined, ABI12_0_0CSSDirectionInherit);

  NSMutableSet<ABI12_0_0RCTShadowView *> *viewsWithNewFrame = [NSMutableSet set];
  [self applyLayoutNode:self.cssNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:CGPointZero];
  return viewsWithNewFrame;
}

@end
