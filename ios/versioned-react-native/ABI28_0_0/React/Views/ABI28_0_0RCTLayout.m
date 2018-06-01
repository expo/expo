/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <YogaABI28_0_0/ABI28_0_0Yoga.h>

#import "ABI28_0_0RCTAssert.h"
#import "ABI28_0_0RCTShadowView+Layout.h"

ABI28_0_0RCTLayoutMetrics ABI28_0_0RCTLayoutMetricsFromYogaNode(ABI28_0_0YGNodeRef yogaNode)
{
  ABI28_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
    (CGPoint){
      ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetLeft(yogaNode)),
      ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetTop(yogaNode))
    },
    (CGSize){
      ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetWidth(yogaNode)),
      ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetHeight(yogaNode))
    }
  };

  UIEdgeInsets padding = (UIEdgeInsets){
    ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetPadding(yogaNode, ABI28_0_0YGEdgeTop)),
    ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetPadding(yogaNode, ABI28_0_0YGEdgeLeft)),
    ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetPadding(yogaNode, ABI28_0_0YGEdgeBottom)),
    ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetPadding(yogaNode, ABI28_0_0YGEdgeRight))
  };

  UIEdgeInsets borderWidth = (UIEdgeInsets){
    ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetBorder(yogaNode, ABI28_0_0YGEdgeTop)),
    ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetBorder(yogaNode, ABI28_0_0YGEdgeLeft)),
    ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetBorder(yogaNode, ABI28_0_0YGEdgeBottom)),
    ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI28_0_0YGNodeLayoutGetBorder(yogaNode, ABI28_0_0YGEdgeRight))
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
  layoutMetrics.displayType = ABI28_0_0RCTReactABI28_0_0DisplayTypeFromYogaDisplayType(ABI28_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI28_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI28_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}


/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI28_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI28_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI28_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI28_0_0RCTCoreGraphicsFloatFromYogaValue(ABI28_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI28_0_0YGUnitPoint:
      return ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI28_0_0YGUnitPercent:
      return ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI28_0_0YGUnitAuto:
    case ABI28_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI28_0_0YGDirection ABI28_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI28_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI28_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI28_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI28_0_0YGDirection direction)
{
  switch (direction) {
    case ABI28_0_0YGDirectionInherit:
    case ABI28_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI28_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI28_0_0YGDisplay ABI28_0_0RCTYogaDisplayTypeFromReactABI28_0_0DisplayType(ABI28_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI28_0_0RCTDisplayTypeNone:
      return ABI28_0_0YGDisplayNone;
    case ABI28_0_0RCTDisplayTypeFlex:
      return ABI28_0_0YGDisplayFlex;
    case ABI28_0_0RCTDisplayTypeInline:
      ABI28_0_0RCTAssert(NO, @"ABI28_0_0RCTDisplayTypeInline cannot be converted to ABI28_0_0YGDisplay value.");
      return ABI28_0_0YGDisplayNone;
  }
}

ABI28_0_0RCTDisplayType ABI28_0_0RCTReactABI28_0_0DisplayTypeFromYogaDisplayType(ABI28_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI28_0_0YGDisplayFlex:
      return ABI28_0_0RCTDisplayTypeFlex;
    case ABI28_0_0YGDisplayNone:
      return ABI28_0_0RCTDisplayTypeNone;
  }
}
