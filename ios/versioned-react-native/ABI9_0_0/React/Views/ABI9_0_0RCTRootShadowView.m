/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTI18nUtil.h"
#import "ABI9_0_0RCTRootShadowView.h"

@implementation ABI9_0_0RCTRootShadowView

/**
 * Init the ABI9_0_0RCTRootShadowView with RTL status.
 * Returns a RTL ABI9_0_0CSS layout if isRTL is true (Default is LTR ABI9_0_0CSS layout).
 */
- (instancetype)init
{
  self = [super init];
  if (self) {
    if ([[ABI9_0_0RCTI18nUtil sharedInstance] isRTL]) {
      ABI9_0_0CSSNodeStyleSetDirection(self.cssNode, ABI9_0_0CSSDirectionRTL);
    }
  }
  return self;
}

- (void)applySizeConstraints
{
  switch (_sizeFlexibility) {
    case ABI9_0_0RCTRootViewSizeFlexibilityNone:
      break;
    case ABI9_0_0RCTRootViewSizeFlexibilityWidth:
      ABI9_0_0CSSNodeStyleSetWidth(self.cssNode, ABI9_0_0CSSUndefined);
      break;
    case ABI9_0_0RCTRootViewSizeFlexibilityHeight:
      ABI9_0_0CSSNodeStyleSetHeight(self.cssNode, ABI9_0_0CSSUndefined);
      break;
    case ABI9_0_0RCTRootViewSizeFlexibilityWidthAndHeight:
      ABI9_0_0CSSNodeStyleSetWidth(self.cssNode, ABI9_0_0CSSUndefined);
      ABI9_0_0CSSNodeStyleSetHeight(self.cssNode, ABI9_0_0CSSUndefined);
      break;
  }
}

- (NSSet<ABI9_0_0RCTShadowView *> *)collectViewsWithUpdatedFrames
{
  [self applySizeConstraints];

  ABI9_0_0CSSNodeCalculateLayout(self.cssNode, ABI9_0_0CSSUndefined, ABI9_0_0CSSUndefined, ABI9_0_0CSSDirectionInherit);

  NSMutableSet<ABI9_0_0RCTShadowView *> *viewsWithNewFrame = [NSMutableSet set];
  [self applyLayoutNode:self.cssNode viewsWithNewFrame:viewsWithNewFrame absolutePosition:CGPointZero];
  return viewsWithNewFrame;
}

@end
