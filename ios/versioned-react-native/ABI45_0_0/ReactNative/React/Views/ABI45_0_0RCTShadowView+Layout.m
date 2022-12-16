/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTShadowView+Layout.h"

#import <ABI45_0_0yoga/ABI45_0_0Yoga.h>

#import "ABI45_0_0RCTAssert.h"

@implementation ABI45_0_0RCTShadowView (Layout)

#pragma mark - Computed Layout-Inferred Metrics

- (UIEdgeInsets)paddingAsInsets
{
  ABI45_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetPadding(yogaNode, ABI45_0_0YGEdgeTop)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetPadding(yogaNode, ABI45_0_0YGEdgeLeft)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetPadding(yogaNode, ABI45_0_0YGEdgeBottom)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetPadding(yogaNode, ABI45_0_0YGEdgeRight))};
}

- (UIEdgeInsets)borderAsInsets
{
  ABI45_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetBorder(yogaNode, ABI45_0_0YGEdgeTop)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetBorder(yogaNode, ABI45_0_0YGEdgeLeft)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetBorder(yogaNode, ABI45_0_0YGEdgeBottom)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetBorder(yogaNode, ABI45_0_0YGEdgeRight))};
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
