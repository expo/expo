/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI32_0_0yoga/ABI32_0_0Yoga.h>

#import "ABI32_0_0RCTAssert.h"
#import "ABI32_0_0RCTShadowView+Layout.h"

ABI32_0_0RCTLayoutMetrics ABI32_0_0RCTLayoutMetricsFromYogaNode(ABI32_0_0YGNodeRef yogaNode)
{
  ABI32_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
    (CGPoint){
      ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetLeft(yogaNode)),
      ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetTop(yogaNode))
    },
    (CGSize){
      ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetWidth(yogaNode)),
      ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetHeight(yogaNode))
    }
  };

  UIEdgeInsets padding = (UIEdgeInsets){
    ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetPadding(yogaNode, ABI32_0_0YGEdgeTop)),
    ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetPadding(yogaNode, ABI32_0_0YGEdgeLeft)),
    ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetPadding(yogaNode, ABI32_0_0YGEdgeBottom)),
    ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetPadding(yogaNode, ABI32_0_0YGEdgeRight))
  };

  UIEdgeInsets borderWidth = (UIEdgeInsets){
    ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetBorder(yogaNode, ABI32_0_0YGEdgeTop)),
    ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetBorder(yogaNode, ABI32_0_0YGEdgeLeft)),
    ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetBorder(yogaNode, ABI32_0_0YGEdgeBottom)),
    ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI32_0_0YGNodeLayoutGetBorder(yogaNode, ABI32_0_0YGEdgeRight))
  };

  UIEdgeInsets compoundInsets = (UIEdgeInsets){
    borderWidth.top + padding.top,
    borderWidth.left + padding.left,
    borderWidth.bottom + padding.bottom,
    borderWidth.right + padding.right
  };

  CGRect bounds = (CGRect){CGPointZero, frame.size};
  CGRect contentFrame = UIEdgeInsetsInsetRect(bounds, compoundInsets);

  layoutMetrics.frame = frame;
  layoutMetrics.borderWidth = borderWidth;
  layoutMetrics.contentFrame = contentFrame;
  layoutMetrics.displayType = ABI32_0_0RCTReactABI32_0_0DisplayTypeFromYogaDisplayType(ABI32_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI32_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI32_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}


/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI32_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI32_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI32_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI32_0_0RCTCoreGraphicsFloatFromYogaValue(ABI32_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI32_0_0YGUnitPoint:
      return ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI32_0_0YGUnitPercent:
      return ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI32_0_0YGUnitAuto:
    case ABI32_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI32_0_0YGDirection ABI32_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI32_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI32_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI32_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI32_0_0YGDirection direction)
{
  switch (direction) {
    case ABI32_0_0YGDirectionInherit:
    case ABI32_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI32_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI32_0_0YGDisplay ABI32_0_0RCTYogaDisplayTypeFromReactABI32_0_0DisplayType(ABI32_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI32_0_0RCTDisplayTypeNone:
      return ABI32_0_0YGDisplayNone;
    case ABI32_0_0RCTDisplayTypeFlex:
      return ABI32_0_0YGDisplayFlex;
    case ABI32_0_0RCTDisplayTypeInline:
      ABI32_0_0RCTAssert(NO, @"ABI32_0_0RCTDisplayTypeInline cannot be converted to ABI32_0_0YGDisplay value.");
      return ABI32_0_0YGDisplayNone;
  }
}

ABI32_0_0RCTDisplayType ABI32_0_0RCTReactABI32_0_0DisplayTypeFromYogaDisplayType(ABI32_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI32_0_0YGDisplayFlex:
      return ABI32_0_0RCTDisplayTypeFlex;
    case ABI32_0_0YGDisplayNone:
      return ABI32_0_0RCTDisplayTypeNone;
  }
}
