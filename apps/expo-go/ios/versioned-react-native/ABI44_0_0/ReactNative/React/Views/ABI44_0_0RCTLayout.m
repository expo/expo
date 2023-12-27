/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0yoga/ABI44_0_0Yoga.h>

#import "ABI44_0_0RCTAssert.h"
#import "ABI44_0_0RCTShadowView+Layout.h"

ABI44_0_0RCTLayoutMetrics ABI44_0_0RCTLayoutMetricsFromYogaNode(ABI44_0_0YGNodeRef yogaNode)
{
  ABI44_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){(CGPoint){ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetLeft(yogaNode)),
                                    ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetTop(yogaNode))},
                          (CGSize){ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetWidth(yogaNode)),
                                   ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetHeight(yogaNode))}};

  UIEdgeInsets padding =
      (UIEdgeInsets){ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetPadding(yogaNode, ABI44_0_0YGEdgeTop)),
                     ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetPadding(yogaNode, ABI44_0_0YGEdgeLeft)),
                     ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetPadding(yogaNode, ABI44_0_0YGEdgeBottom)),
                     ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetPadding(yogaNode, ABI44_0_0YGEdgeRight))};

  UIEdgeInsets borderWidth =
      (UIEdgeInsets){ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetBorder(yogaNode, ABI44_0_0YGEdgeTop)),
                     ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetBorder(yogaNode, ABI44_0_0YGEdgeLeft)),
                     ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetBorder(yogaNode, ABI44_0_0YGEdgeBottom)),
                     ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI44_0_0YGNodeLayoutGetBorder(yogaNode, ABI44_0_0YGEdgeRight))};

  UIEdgeInsets compoundInsets = (UIEdgeInsets){borderWidth.top + padding.top,
                                               borderWidth.left + padding.left,
                                               borderWidth.bottom + padding.bottom,
                                               borderWidth.right + padding.right};

  CGRect bounds = (CGRect){CGPointZero, frame.size};
  CGRect contentFrame = UIEdgeInsetsInsetRect(bounds, compoundInsets);

  layoutMetrics.frame = frame;
  layoutMetrics.borderWidth = borderWidth;
  layoutMetrics.contentFrame = contentFrame;
  layoutMetrics.displayType = ABI44_0_0RCTABI44_0_0ReactDisplayTypeFromYogaDisplayType(ABI44_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI44_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI44_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI44_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI44_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI44_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI44_0_0RCTCoreGraphicsFloatFromYogaValue(ABI44_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI44_0_0YGUnitPoint:
      return ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI44_0_0YGUnitPercent:
      return ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI44_0_0YGUnitAuto:
    case ABI44_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI44_0_0YGDirection ABI44_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI44_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI44_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI44_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI44_0_0YGDirection direction)
{
  switch (direction) {
    case ABI44_0_0YGDirectionInherit:
    case ABI44_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI44_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI44_0_0YGDisplay ABI44_0_0RCTYogaDisplayTypeFromABI44_0_0ReactDisplayType(ABI44_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI44_0_0RCTDisplayTypeNone:
      return ABI44_0_0YGDisplayNone;
    case ABI44_0_0RCTDisplayTypeFlex:
      return ABI44_0_0YGDisplayFlex;
    case ABI44_0_0RCTDisplayTypeInline:
      ABI44_0_0RCTAssert(NO, @"ABI44_0_0RCTDisplayTypeInline cannot be converted to ABI44_0_0YGDisplay value.");
      return ABI44_0_0YGDisplayNone;
  }
}

ABI44_0_0RCTDisplayType ABI44_0_0RCTABI44_0_0ReactDisplayTypeFromYogaDisplayType(ABI44_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI44_0_0YGDisplayFlex:
      return ABI44_0_0RCTDisplayTypeFlex;
    case ABI44_0_0YGDisplayNone:
      return ABI44_0_0RCTDisplayTypeNone;
  }
}
