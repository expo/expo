/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTShadowView+Layout.h"

#import <ABI29_0_0yoga/ABI29_0_0Yoga.h>

#import "ABI29_0_0RCTAssert.h"

@implementation ABI29_0_0RCTShadowView (Layout)

#pragma mark - Computed Layout-Inferred Metrics

- (UIEdgeInsets)paddingAsInsets
{
  ABI29_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetPadding(yogaNode, ABI29_0_0YGEdgeTop)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetPadding(yogaNode, ABI29_0_0YGEdgeLeft)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetPadding(yogaNode, ABI29_0_0YGEdgeBottom)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetPadding(yogaNode, ABI29_0_0YGEdgeRight))
  };
}

- (UIEdgeInsets)borderAsInsets
{
  ABI29_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetBorder(yogaNode, ABI29_0_0YGEdgeTop)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetBorder(yogaNode, ABI29_0_0YGEdgeLeft)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetBorder(yogaNode, ABI29_0_0YGEdgeBottom)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetBorder(yogaNode, ABI29_0_0YGEdgeRight))
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
