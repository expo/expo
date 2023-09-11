/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTShadowView+Layout.h"

#import <ABI47_0_0yoga/ABI47_0_0Yoga.h>

#import "ABI47_0_0RCTAssert.h"

@implementation ABI47_0_0RCTShadowView (Layout)

#pragma mark - Computed Layout-Inferred Metrics

- (UIEdgeInsets)paddingAsInsets
{
  ABI47_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetPadding(yogaNode, ABI47_0_0YGEdgeTop)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetPadding(yogaNode, ABI47_0_0YGEdgeLeft)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetPadding(yogaNode, ABI47_0_0YGEdgeBottom)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetPadding(yogaNode, ABI47_0_0YGEdgeRight))};
}

- (UIEdgeInsets)borderAsInsets
{
  ABI47_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetBorder(yogaNode, ABI47_0_0YGEdgeTop)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetBorder(yogaNode, ABI47_0_0YGEdgeLeft)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetBorder(yogaNode, ABI47_0_0YGEdgeBottom)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetBorder(yogaNode, ABI47_0_0YGEdgeRight))};
}

- (UIEdgeInsets)compoundInsets
{
  UIEdgeInsets borderAsInsets = self.borderAsInsets;
  UIEdgeInsets paddingAsInsets = self.paddingAsInsets;

  return (UIEdgeInsets){
      borderAsInsets.top + paddingAsInsets.top,
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
