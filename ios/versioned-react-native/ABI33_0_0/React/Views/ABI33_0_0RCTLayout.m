/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI33_0_0yoga/ABI33_0_0Yoga.h>

#import "ABI33_0_0RCTAssert.h"
#import "ABI33_0_0RCTShadowView+Layout.h"

ABI33_0_0RCTLayoutMetrics ABI33_0_0RCTLayoutMetricsFromYogaNode(ABI33_0_0YGNodeRef ABI33_0_0yogaNode)
{
  ABI33_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
    (CGPoint){
      ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetLeft(ABI33_0_0yogaNode)),
      ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetTop(ABI33_0_0yogaNode))
    },
    (CGSize){
      ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetWidth(ABI33_0_0yogaNode)),
      ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetHeight(ABI33_0_0yogaNode))
    }
  };

  UIEdgeInsets padding = (UIEdgeInsets){
    ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetPadding(ABI33_0_0yogaNode, ABI33_0_0YGEdgeTop)),
    ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetPadding(ABI33_0_0yogaNode, ABI33_0_0YGEdgeLeft)),
    ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetPadding(ABI33_0_0yogaNode, ABI33_0_0YGEdgeBottom)),
    ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetPadding(ABI33_0_0yogaNode, ABI33_0_0YGEdgeRight))
  };

  UIEdgeInsets borderWidth = (UIEdgeInsets){
    ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetBorder(ABI33_0_0yogaNode, ABI33_0_0YGEdgeTop)),
    ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetBorder(ABI33_0_0yogaNode, ABI33_0_0YGEdgeLeft)),
    ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetBorder(ABI33_0_0yogaNode, ABI33_0_0YGEdgeBottom)),
    ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI33_0_0YGNodeLayoutGetBorder(ABI33_0_0yogaNode, ABI33_0_0YGEdgeRight))
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
  layoutMetrics.displayType = ABI33_0_0RCTReactABI33_0_0DisplayTypeFromYogaDisplayType(ABI33_0_0YGNodeStyleGetDisplay(ABI33_0_0yogaNode));
  layoutMetrics.layoutDirection = ABI33_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI33_0_0YGNodeLayoutGetDirection(ABI33_0_0yogaNode));

  return layoutMetrics;
}


/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI33_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI33_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI33_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI33_0_0RCTCoreGraphicsFloatFromYogaValue(ABI33_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI33_0_0YGUnitPoint:
      return ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI33_0_0YGUnitPercent:
      return ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI33_0_0YGUnitAuto:
    case ABI33_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI33_0_0YGDirection ABI33_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI33_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI33_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI33_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI33_0_0YGDirection direction)
{
  switch (direction) {
    case ABI33_0_0YGDirectionInherit:
    case ABI33_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI33_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI33_0_0YGDisplay ABI33_0_0RCTYogaDisplayTypeFromReactABI33_0_0DisplayType(ABI33_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI33_0_0RCTDisplayTypeNone:
      return ABI33_0_0YGDisplayNone;
    case ABI33_0_0RCTDisplayTypeFlex:
      return ABI33_0_0YGDisplayFlex;
    case ABI33_0_0RCTDisplayTypeInline:
      ABI33_0_0RCTAssert(NO, @"ABI33_0_0RCTDisplayTypeInline cannot be converted to ABI33_0_0YGDisplay value.");
      return ABI33_0_0YGDisplayNone;
  }
}

ABI33_0_0RCTDisplayType ABI33_0_0RCTReactABI33_0_0DisplayTypeFromYogaDisplayType(ABI33_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI33_0_0YGDisplayFlex:
      return ABI33_0_0RCTDisplayTypeFlex;
    case ABI33_0_0YGDisplayNone:
      return ABI33_0_0RCTDisplayTypeNone;
  }
}
