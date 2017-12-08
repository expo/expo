/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTScrollContentShadowView.h"

#import <yogaABI24_0_0/ABI24_0_0Yoga.h>

#import "ABI24_0_0RCTUtils.h"

@interface ABI24_0_0RCTShadowView () {
  // This will be removed after t15757916, which will remove
  // side-effects from `setFrame:` method.
  @public CGRect _frame;
}
@end

@implementation ABI24_0_0RCTScrollContentShadowView

- (void)applyLayoutNode:(ABI24_0_0YGNodeRef)node
      viewsWithNewFrame:(NSMutableSet<ABI24_0_0RCTShadowView *> *)viewsWithNewFrame
       absolutePosition:(CGPoint)absolutePosition
{
  // Call super method if LTR layout is enforced.
  if (ABI24_0_0YGNodeLayoutGetDirection(self.yogaNode) != ABI24_0_0YGDirectionRTL) {
    [super applyLayoutNode:node
         viewsWithNewFrame:viewsWithNewFrame
          absolutePosition:absolutePosition];
    return;
  }

  // Motivation:
  // Yoga place `contentView` on the right side of `scrollView` when RTL layout is enfoced.
  // That breaks everything; it is completly pointless to (re)position `contentView`
  // because it is `contentView`'s job. So, we work around it here.

  // Step 1. Compensate `absolutePosition` change.
  CGFloat xCompensation = ABI24_0_0YGNodeLayoutGetRight(node) - ABI24_0_0YGNodeLayoutGetLeft(node);
  absolutePosition.x += xCompensation;

  // Step 2. Call super method.
  [super applyLayoutNode:node
       viewsWithNewFrame:viewsWithNewFrame
        absolutePosition:absolutePosition];

  // Step 3. Reset the position.
  _frame.origin.x = ABI24_0_0RCTRoundPixelValue(ABI24_0_0YGNodeLayoutGetRight(node));
}

@end
