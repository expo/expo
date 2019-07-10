/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTShadowView+Layout.h"

#import <ABI34_0_0yoga/ABI34_0_0Yoga.h>

#import "ABI34_0_0RCTAssert.h"

@implementation ABI34_0_0RCTShadowView (Layout)

#pragma mark - Computed Layout-Inferred Metrics

- (UIEdgeInsets)paddingAsInsets
{
  ABI34_0_0YGNodeRef ABI34_0_0yogaNode = self.ABI34_0_0yogaNode;
  return (UIEdgeInsets){
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(ABI34_0_0yogaNode, ABI34_0_0YGEdgeTop)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(ABI34_0_0yogaNode, ABI34_0_0YGEdgeLeft)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(ABI34_0_0yogaNode, ABI34_0_0YGEdgeBottom)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(ABI34_0_0yogaNode, ABI34_0_0YGEdgeRight))
  };
}

- (UIEdgeInsets)borderAsInsets
{
  ABI34_0_0YGNodeRef ABI34_0_0yogaNode = self.ABI34_0_0yogaNode;
  return (UIEdgeInsets){
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(ABI34_0_0yogaNode, ABI34_0_0YGEdgeTop)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(ABI34_0_0yogaNode, ABI34_0_0YGEdgeLeft)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(ABI34_0_0yogaNode, ABI34_0_0YGEdgeBottom)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(ABI34_0_0yogaNode, ABI34_0_0YGEdgeRight))
  };
}

- (UIEdgeInsets)compoundInsets
{
  UIEdgeInsets borderAsInsets = self.borderAsInsets;
  UIEdgeInsets paddingAsInsets = self.paddingAsInsets;

  return (UIEdgeInsets){
    borderAsInsets.top + paddingAsInsets.top,
    borderAsInsets.left + paddingAsInsets.left,
    borderAsInsets.bottom + paddingAsInsets.bottom,
    borderAsInsets.right + paddingAsInsets.right
  };
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
  // The default implementaion does nothing.
}

- (void)clearLayout
{
  // The default implementaion does nothing.
}

@end
