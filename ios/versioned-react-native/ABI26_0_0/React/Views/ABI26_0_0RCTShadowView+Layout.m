/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTShadowView+Layout.h"

#import <YogaABI26_0_0/ABI26_0_0Yoga.h>

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI26_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI26_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI26_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI26_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

@implementation ABI26_0_0RCTShadowView (Layout)

#pragma mark - Computed Layout-Inferred Metrics

- (UIEdgeInsets)paddingAsInsets
{
  ABI26_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
    ABI26_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI26_0_0YGNodeLayoutGetPadding(yogaNode, ABI26_0_0YGEdgeTop)),
    ABI26_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI26_0_0YGNodeLayoutGetPadding(yogaNode, ABI26_0_0YGEdgeLeft)),
    ABI26_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI26_0_0YGNodeLayoutGetPadding(yogaNode, ABI26_0_0YGEdgeBottom)),
    ABI26_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI26_0_0YGNodeLayoutGetPadding(yogaNode, ABI26_0_0YGEdgeRight))
  };
}

- (UIEdgeInsets)borderAsInsets
{
  ABI26_0_0YGNodeRef yogaNode = self.yogaNode;
  return (UIEdgeInsets){
    ABI26_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI26_0_0YGNodeLayoutGetBorder(yogaNode, ABI26_0_0YGEdgeTop)),
    ABI26_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI26_0_0YGNodeLayoutGetBorder(yogaNode, ABI26_0_0YGEdgeLeft)),
    ABI26_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI26_0_0YGNodeLayoutGetBorder(yogaNode, ABI26_0_0YGEdgeBottom)),
    ABI26_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI26_0_0YGNodeLayoutGetBorder(yogaNode, ABI26_0_0YGEdgeRight))
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
  return UIEdgeInsetsInsetRect((CGRect){CGPointZero, self.frame.size}, self.compoundInsets).size;
}

- (CGRect)contentFrame
{
  CGRect bounds = (CGRect){CGPointZero, self.frame.size};
  return UIEdgeInsetsInsetRect(bounds, self.compoundInsets);
}

#pragma mark - Measuring

- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize
{
  ABI26_0_0YGNodeRef clonnedYogaNode = ABI26_0_0YGNodeClone(self.yogaNode);
  ABI26_0_0YGNodeRef constraintYogaNode = ABI26_0_0YGNodeNewWithConfig([[self class] yogaConfig]);

  ABI26_0_0YGNodeInsertChild(constraintYogaNode, clonnedYogaNode, 0);

  ABI26_0_0YGNodeStyleSetMinWidth(constraintYogaNode, ABI26_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.width));
  ABI26_0_0YGNodeStyleSetMinHeight(constraintYogaNode, ABI26_0_0RCTYogaFloatFromCoreGraphicsFloat(minimumSize.height));
  ABI26_0_0YGNodeStyleSetMaxWidth(constraintYogaNode, ABI26_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.width));
  ABI26_0_0YGNodeStyleSetMaxHeight(constraintYogaNode, ABI26_0_0RCTYogaFloatFromCoreGraphicsFloat(maximumSize.height));

  ABI26_0_0YGNodeCalculateLayout(
    constraintYogaNode,
    ABI26_0_0YGUndefined,
    ABI26_0_0YGUndefined,
    self.layoutDirection
  );

  CGSize measuredSize = (CGSize){
    ABI26_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI26_0_0YGNodeLayoutGetWidth(constraintYogaNode)),
    ABI26_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI26_0_0YGNodeLayoutGetHeight(constraintYogaNode)),
  };

  ABI26_0_0YGNodeRemoveChild(constraintYogaNode, clonnedYogaNode);
  ABI26_0_0YGNodeFree(constraintYogaNode);
  ABI26_0_0YGNodeFree(clonnedYogaNode);

  return measuredSize;
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
