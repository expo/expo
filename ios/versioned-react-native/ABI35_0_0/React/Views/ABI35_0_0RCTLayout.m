/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI35_0_0yoga/ABI35_0_0Yoga.h>

#import "ABI35_0_0RCTAssert.h"
#import "ABI35_0_0RCTShadowView+Layout.h"

ABI35_0_0RCTLayoutMetrics ABI35_0_0RCTLayoutMetricsFromYogaNode(ABI35_0_0YGNodeRef ABI35_0_0yogaNode)
{
  ABI35_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
    (CGPoint){
      ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetLeft(ABI35_0_0yogaNode)),
      ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetTop(ABI35_0_0yogaNode))
    },
    (CGSize){
      ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetWidth(ABI35_0_0yogaNode)),
      ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetHeight(ABI35_0_0yogaNode))
    }
  };

  UIEdgeInsets padding = (UIEdgeInsets){
    ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetPadding(ABI35_0_0yogaNode, ABI35_0_0YGEdgeTop)),
    ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetPadding(ABI35_0_0yogaNode, ABI35_0_0YGEdgeLeft)),
    ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetPadding(ABI35_0_0yogaNode, ABI35_0_0YGEdgeBottom)),
    ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetPadding(ABI35_0_0yogaNode, ABI35_0_0YGEdgeRight))
  };

  UIEdgeInsets borderWidth = (UIEdgeInsets){
    ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetBorder(ABI35_0_0yogaNode, ABI35_0_0YGEdgeTop)),
    ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetBorder(ABI35_0_0yogaNode, ABI35_0_0YGEdgeLeft)),
    ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetBorder(ABI35_0_0yogaNode, ABI35_0_0YGEdgeBottom)),
    ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI35_0_0YGNodeLayoutGetBorder(ABI35_0_0yogaNode, ABI35_0_0YGEdgeRight))
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
  layoutMetrics.displayType = ABI35_0_0RCTReactABI35_0_0DisplayTypeFromYogaDisplayType(ABI35_0_0YGNodeStyleGetDisplay(ABI35_0_0yogaNode));
  layoutMetrics.layoutDirection = ABI35_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI35_0_0YGNodeLayoutGetDirection(ABI35_0_0yogaNode));

  return layoutMetrics;
}


/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI35_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI35_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI35_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI35_0_0RCTCoreGraphicsFloatFromYogaValue(ABI35_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI35_0_0YGUnitPoint:
      return ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI35_0_0YGUnitPercent:
      return ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI35_0_0YGUnitAuto:
    case ABI35_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI35_0_0YGDirection ABI35_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI35_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI35_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI35_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI35_0_0YGDirection direction)
{
  switch (direction) {
    case ABI35_0_0YGDirectionInherit:
    case ABI35_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI35_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI35_0_0YGDisplay ABI35_0_0RCTYogaDisplayTypeFromReactABI35_0_0DisplayType(ABI35_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI35_0_0RCTDisplayTypeNone:
      return ABI35_0_0YGDisplayNone;
    case ABI35_0_0RCTDisplayTypeFlex:
      return ABI35_0_0YGDisplayFlex;
    case ABI35_0_0RCTDisplayTypeInline:
      ABI35_0_0RCTAssert(NO, @"ABI35_0_0RCTDisplayTypeInline cannot be converted to ABI35_0_0YGDisplay value.");
      return ABI35_0_0YGDisplayNone;
  }
}

ABI35_0_0RCTDisplayType ABI35_0_0RCTReactABI35_0_0DisplayTypeFromYogaDisplayType(ABI35_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI35_0_0YGDisplayFlex:
      return ABI35_0_0RCTDisplayTypeFlex;
    case ABI35_0_0YGDisplayNone:
      return ABI35_0_0RCTDisplayTypeNone;
  }
}
