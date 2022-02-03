/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTShadowView+Layout.h"

#import <ABI44_0_0yoga/ABI44_0_0Yoga.h>

#import "ABI44_0_0RCTAssert.h"

@implementation ABI44_0_0RCTShadowView (Layout)

#pragma mark - Computed Layout-Inferred Metrics

- (UIEdgeInsets)paddingAsInsets
{
  ABI44_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetPadding(yogaNode, ABI44_0_0YGEdgeTop)),
                        ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetPadding(yogaNode, ABI44_0_0YGEdgeLeft)),
                        ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetPadding(yogaNode, ABI44_0_0YGEdgeBottom)),
                        ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetPadding(yogaNode, ABI44_0_0YGEdgeRight))};
}

- (UIEdgeInsets)borderAsInsets
{
  ABI44_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetBorder(yogaNode, ABI44_0_0YGEdgeTop)),
                        ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetBorder(yogaNode, ABI44_0_0YGEdgeLeft)),
                        ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetBorder(yogaNode, ABI44_0_0YGEdgeBottom)),
                        ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetBorder(yogaNode, ABI44_0_0YGEdgeRight))};
}

- (UIEdgeInsets)compoundInsets
{
  UIEdgeInsets borderAsInsets = self.borderAsInsets;
  UIEdgeInsets paddingAsInsets = self.paddingAsInsets;

  return (UIEdgeInsets){borderAsInsets.top + paddingAsInsets.top,
                        borderAsInsets.left + paddingAsInsets.left,
                        borderAsInsets.bottom + paddingAsInsets.bottom,
                        borderAsInsets.right + paddingAsInsets.right};
}

- (CGSize)availableSize
{
  return self.layoutMetrics.contentFrame.size;
}

- (CGRect)contentFrame
{
  return self.layoutMetrics.contentFrame;
}

#pragma mark - Dirty Propagation Control

- (void)dirtyLayout
{
  // The default implementation does nothing.
}

- (void)clearLayout
{
  // The default implementation does nothing.
}

@end
