/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTShadowView+Layout.h"

#import <yogaABI27_0_0/ABI27_0_0yoga.h>

#import "ABI27_0_0RCTAssert.h"

@implementation ABI27_0_0RCTShadowView (Layout)

#pragma mark - Computed Layout-Inferred Metrics

- (UIEdgeInsets)paddingAsInsets
{
  ABI27_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetPadding(yogaNode, ABI27_0_0YGEdgeTop)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetPadding(yogaNode, ABI27_0_0YGEdgeLeft)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetPadding(yogaNode, ABI27_0_0YGEdgeBottom)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetPadding(yogaNode, ABI27_0_0YGEdgeRight))
  };
}

- (UIEdgeInsets)borderAsInsets
{
  ABI27_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetBorder(yogaNode, ABI27_0_0YGEdgeTop)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetBorder(yogaNode, ABI27_0_0YGEdgeLeft)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetBorder(yogaNode, ABI27_0_0YGEdgeBottom)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetBorder(yogaNode, ABI27_0_0YGEdgeRight))
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
