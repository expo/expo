/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0yoga/ABI41_0_0Yoga.h>

#import "ABI41_0_0RCTAssert.h"
#import "ABI41_0_0RCTShadowView+Layout.h"

ABI41_0_0RCTLayoutMetrics ABI41_0_0RCTLayoutMetricsFromYogaNode(ABI41_0_0YGNodeRef yogaNode)
{
  ABI41_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){(CGPoint){ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetLeft(yogaNode)),
                                    ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetTop(yogaNode))},
                          (CGSize){ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetWidth(yogaNode)),
                                   ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetHeight(yogaNode))}};

  UIEdgeInsets padding =
      (UIEdgeInsets){ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetPadding(yogaNode, ABI41_0_0YGEdgeTop)),
                     ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetPadding(yogaNode, ABI41_0_0YGEdgeLeft)),
                     ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetPadding(yogaNode, ABI41_0_0YGEdgeBottom)),
                     ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetPadding(yogaNode, ABI41_0_0YGEdgeRight))};

  UIEdgeInsets borderWidth =
      (UIEdgeInsets){ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetBorder(yogaNode, ABI41_0_0YGEdgeTop)),
                     ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetBorder(yogaNode, ABI41_0_0YGEdgeLeft)),
                     ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetBorder(yogaNode, ABI41_0_0YGEdgeBottom)),
                     ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI41_0_0YGNodeLayoutGetBorder(yogaNode, ABI41_0_0YGEdgeRight))};

  UIEdgeInsets compoundInsets = (UIEdgeInsets){borderWidth.top + padding.top,
                                               borderWidth.left + padding.left,
                                               borderWidth.bottom + padding.bottom,
                                               borderWidth.right + padding.right};

  CGRect bounds = (CGRect){CGPointZero, frame.size};
  CGRect contentFrame = UIEdgeInsetsInsetRect(bounds, compoundInsets);

  layoutMetrics.frame = frame;
  layoutMetrics.borderWidth = borderWidth;
  layoutMetrics.contentFrame = contentFrame;
  layoutMetrics.displayType = ABI41_0_0RCTABI41_0_0ReactDisplayTypeFromYogaDisplayType(ABI41_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI41_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI41_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI41_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI41_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI41_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI41_0_0RCTCoreGraphicsFloatFromYogaValue(ABI41_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI41_0_0YGUnitPoint:
      return ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI41_0_0YGUnitPercent:
      return ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI41_0_0YGUnitAuto:
    case ABI41_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI41_0_0YGDirection ABI41_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI41_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI41_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI41_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI41_0_0YGDirection direction)
{
  switch (direction) {
    case ABI41_0_0YGDirectionInherit:
    case ABI41_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI41_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI41_0_0YGDisplay ABI41_0_0RCTYogaDisplayTypeFromABI41_0_0ReactDisplayType(ABI41_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI41_0_0RCTDisplayTypeNone:
      return ABI41_0_0YGDisplayNone;
    case ABI41_0_0RCTDisplayTypeFlex:
      return ABI41_0_0YGDisplayFlex;
    case ABI41_0_0RCTDisplayTypeInline:
      ABI41_0_0RCTAssert(NO, @"ABI41_0_0RCTDisplayTypeInline cannot be converted to ABI41_0_0YGDisplay value.");
      return ABI41_0_0YGDisplayNone;
  }
}

ABI41_0_0RCTDisplayType ABI41_0_0RCTABI41_0_0ReactDisplayTypeFromYogaDisplayType(ABI41_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI41_0_0YGDisplayFlex:
      return ABI41_0_0RCTDisplayTypeFlex;
    case ABI41_0_0YGDisplayNone:
      return ABI41_0_0RCTDisplayTypeNone;
  }
}
