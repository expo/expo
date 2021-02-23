/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0yoga/ABI40_0_0Yoga.h>

#import "ABI40_0_0RCTAssert.h"
#import "ABI40_0_0RCTShadowView+Layout.h"

ABI40_0_0RCTLayoutMetrics ABI40_0_0RCTLayoutMetricsFromYogaNode(ABI40_0_0YGNodeRef yogaNode)
{
  ABI40_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){(CGPoint){ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetLeft(yogaNode)),
                                    ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetTop(yogaNode))},
                          (CGSize){ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetWidth(yogaNode)),
                                   ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetHeight(yogaNode))}};

  UIEdgeInsets padding =
      (UIEdgeInsets){ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetPadding(yogaNode, ABI40_0_0YGEdgeTop)),
                     ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetPadding(yogaNode, ABI40_0_0YGEdgeLeft)),
                     ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetPadding(yogaNode, ABI40_0_0YGEdgeBottom)),
                     ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetPadding(yogaNode, ABI40_0_0YGEdgeRight))};

  UIEdgeInsets borderWidth =
      (UIEdgeInsets){ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetBorder(yogaNode, ABI40_0_0YGEdgeTop)),
                     ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetBorder(yogaNode, ABI40_0_0YGEdgeLeft)),
                     ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetBorder(yogaNode, ABI40_0_0YGEdgeBottom)),
                     ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI40_0_0YGNodeLayoutGetBorder(yogaNode, ABI40_0_0YGEdgeRight))};

  UIEdgeInsets compoundInsets = (UIEdgeInsets){borderWidth.top + padding.top,
                                               borderWidth.left + padding.left,
                                               borderWidth.bottom + padding.bottom,
                                               borderWidth.right + padding.right};

  CGRect bounds = (CGRect){CGPointZero, frame.size};
  CGRect contentFrame = UIEdgeInsetsInsetRect(bounds, compoundInsets);

  layoutMetrics.frame = frame;
  layoutMetrics.borderWidth = borderWidth;
  layoutMetrics.contentFrame = contentFrame;
  layoutMetrics.displayType = ABI40_0_0RCTABI40_0_0ReactDisplayTypeFromYogaDisplayType(ABI40_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI40_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI40_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI40_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI40_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI40_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI40_0_0RCTCoreGraphicsFloatFromYogaValue(ABI40_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI40_0_0YGUnitPoint:
      return ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI40_0_0YGUnitPercent:
      return ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI40_0_0YGUnitAuto:
    case ABI40_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI40_0_0YGDirection ABI40_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI40_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI40_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI40_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI40_0_0YGDirection direction)
{
  switch (direction) {
    case ABI40_0_0YGDirectionInherit:
    case ABI40_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI40_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI40_0_0YGDisplay ABI40_0_0RCTYogaDisplayTypeFromABI40_0_0ReactDisplayType(ABI40_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI40_0_0RCTDisplayTypeNone:
      return ABI40_0_0YGDisplayNone;
    case ABI40_0_0RCTDisplayTypeFlex:
      return ABI40_0_0YGDisplayFlex;
    case ABI40_0_0RCTDisplayTypeInline:
      ABI40_0_0RCTAssert(NO, @"ABI40_0_0RCTDisplayTypeInline cannot be converted to ABI40_0_0YGDisplay value.");
      return ABI40_0_0YGDisplayNone;
  }
}

ABI40_0_0RCTDisplayType ABI40_0_0RCTABI40_0_0ReactDisplayTypeFromYogaDisplayType(ABI40_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI40_0_0YGDisplayFlex:
      return ABI40_0_0RCTDisplayTypeFlex;
    case ABI40_0_0YGDisplayNone:
      return ABI40_0_0RCTDisplayTypeNone;
  }
}
