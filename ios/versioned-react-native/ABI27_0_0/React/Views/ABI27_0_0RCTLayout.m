/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <yogaABI27_0_0/ABI27_0_0yoga.h>

#import "ABI27_0_0RCTAssert.h"
#import "ABI27_0_0RCTShadowView+Layout.h"

ABI27_0_0RCTLayoutMetrics ABI27_0_0RCTLayoutMetricsFromYogaNode(ABI27_0_0YGNodeRef yogaNode)
{
  ABI27_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
    (CGPoint){
      ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetLeft(yogaNode)),
      ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetTop(yogaNode))
    },
    (CGSize){
      ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetWidth(yogaNode)),
      ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetHeight(yogaNode))
    }
  };

  UIEdgeInsets padding = (UIEdgeInsets){
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetPadding(yogaNode, ABI27_0_0YGEdgeTop)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetPadding(yogaNode, ABI27_0_0YGEdgeLeft)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetPadding(yogaNode, ABI27_0_0YGEdgeBottom)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetPadding(yogaNode, ABI27_0_0YGEdgeRight))
  };

  UIEdgeInsets borderWidth = (UIEdgeInsets){
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetBorder(yogaNode, ABI27_0_0YGEdgeTop)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetBorder(yogaNode, ABI27_0_0YGEdgeLeft)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetBorder(yogaNode, ABI27_0_0YGEdgeBottom)),
    ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI27_0_0YGNodeLayoutGetBorder(yogaNode, ABI27_0_0YGEdgeRight))
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
  layoutMetrics.displayType = ABI27_0_0RCTReactABI27_0_0DisplayTypeFromYogaDisplayType(ABI27_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI27_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI27_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}


/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI27_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI27_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI27_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI27_0_0RCTCoreGraphicsFloatFromYogaValue(ABI27_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI27_0_0YGUnitPoint:
      return ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI27_0_0YGUnitPercent:
      return ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI27_0_0YGUnitAuto:
    case ABI27_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI27_0_0YGDirection ABI27_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI27_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI27_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI27_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI27_0_0YGDirection direction)
{
  switch (direction) {
    case ABI27_0_0YGDirectionInherit:
    case ABI27_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI27_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI27_0_0YGDisplay ABI27_0_0RCTYogaDisplayTypeFromReactABI27_0_0DisplayType(ABI27_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI27_0_0RCTDisplayTypeNone:
      return ABI27_0_0YGDisplayNone;
    case ABI27_0_0RCTDisplayTypeFlex:
      return ABI27_0_0YGDisplayFlex;
    case ABI27_0_0RCTDisplayTypeInline:
      ABI27_0_0RCTAssert(NO, @"ABI27_0_0RCTDisplayTypeInline cannot be converted to ABI27_0_0YGDisplay value.");
      return ABI27_0_0YGDisplayNone;
  }
}

ABI27_0_0RCTDisplayType ABI27_0_0RCTReactABI27_0_0DisplayTypeFromYogaDisplayType(ABI27_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI27_0_0YGDisplayFlex:
      return ABI27_0_0RCTDisplayTypeFlex;
    case ABI27_0_0YGDisplayNone:
      return ABI27_0_0RCTDisplayTypeNone;
  }
}
