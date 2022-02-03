/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0yoga/ABI43_0_0Yoga.h>

#import "ABI43_0_0RCTAssert.h"
#import "ABI43_0_0RCTShadowView+Layout.h"

ABI43_0_0RCTLayoutMetrics ABI43_0_0RCTLayoutMetricsFromYogaNode(ABI43_0_0YGNodeRef yogaNode)
{
  ABI43_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){(CGPoint){ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetLeft(yogaNode)),
                                    ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetTop(yogaNode))},
                          (CGSize){ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetWidth(yogaNode)),
                                   ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetHeight(yogaNode))}};

  UIEdgeInsets padding =
      (UIEdgeInsets){ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetPadding(yogaNode, ABI43_0_0YGEdgeTop)),
                     ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetPadding(yogaNode, ABI43_0_0YGEdgeLeft)),
                     ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetPadding(yogaNode, ABI43_0_0YGEdgeBottom)),
                     ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetPadding(yogaNode, ABI43_0_0YGEdgeRight))};

  UIEdgeInsets borderWidth =
      (UIEdgeInsets){ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetBorder(yogaNode, ABI43_0_0YGEdgeTop)),
                     ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetBorder(yogaNode, ABI43_0_0YGEdgeLeft)),
                     ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetBorder(yogaNode, ABI43_0_0YGEdgeBottom)),
                     ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI43_0_0YGNodeLayoutGetBorder(yogaNode, ABI43_0_0YGEdgeRight))};

  UIEdgeInsets compoundInsets = (UIEdgeInsets){borderWidth.top + padding.top,
                                               borderWidth.left + padding.left,
                                               borderWidth.bottom + padding.bottom,
                                               borderWidth.right + padding.right};

  CGRect bounds = (CGRect){CGPointZero, frame.size};
  CGRect contentFrame = UIEdgeInsetsInsetRect(bounds, compoundInsets);

  layoutMetrics.frame = frame;
  layoutMetrics.borderWidth = borderWidth;
  layoutMetrics.contentFrame = contentFrame;
  layoutMetrics.displayType = ABI43_0_0RCTABI43_0_0ReactDisplayTypeFromYogaDisplayType(ABI43_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI43_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI43_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI43_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI43_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI43_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI43_0_0RCTCoreGraphicsFloatFromYogaValue(ABI43_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI43_0_0YGUnitPoint:
      return ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI43_0_0YGUnitPercent:
      return ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI43_0_0YGUnitAuto:
    case ABI43_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI43_0_0YGDirection ABI43_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI43_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI43_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI43_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI43_0_0YGDirection direction)
{
  switch (direction) {
    case ABI43_0_0YGDirectionInherit:
    case ABI43_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI43_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI43_0_0YGDisplay ABI43_0_0RCTYogaDisplayTypeFromABI43_0_0ReactDisplayType(ABI43_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI43_0_0RCTDisplayTypeNone:
      return ABI43_0_0YGDisplayNone;
    case ABI43_0_0RCTDisplayTypeFlex:
      return ABI43_0_0YGDisplayFlex;
    case ABI43_0_0RCTDisplayTypeInline:
      ABI43_0_0RCTAssert(NO, @"ABI43_0_0RCTDisplayTypeInline cannot be converted to ABI43_0_0YGDisplay value.");
      return ABI43_0_0YGDisplayNone;
  }
}

ABI43_0_0RCTDisplayType ABI43_0_0RCTABI43_0_0ReactDisplayTypeFromYogaDisplayType(ABI43_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI43_0_0YGDisplayFlex:
      return ABI43_0_0RCTDisplayTypeFlex;
    case ABI43_0_0YGDisplayNone:
      return ABI43_0_0RCTDisplayTypeNone;
  }
}
