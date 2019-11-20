/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI34_0_0yoga/ABI34_0_0Yoga.h>

#import "ABI34_0_0RCTAssert.h"
#import "ABI34_0_0RCTShadowView+Layout.h"

ABI34_0_0RCTLayoutMetrics ABI34_0_0RCTLayoutMetricsFromYogaNode(ABI34_0_0YGNodeRef ABI34_0_0yogaNode)
{
  ABI34_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
    (CGPoint){
      ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetLeft(ABI34_0_0yogaNode)),
      ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetTop(ABI34_0_0yogaNode))
    },
    (CGSize){
      ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetWidth(ABI34_0_0yogaNode)),
      ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetHeight(ABI34_0_0yogaNode))
    }
  };

  UIEdgeInsets padding = (UIEdgeInsets){
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(ABI34_0_0yogaNode, ABI34_0_0YGEdgeTop)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(ABI34_0_0yogaNode, ABI34_0_0YGEdgeLeft)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(ABI34_0_0yogaNode, ABI34_0_0YGEdgeBottom)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetPadding(ABI34_0_0yogaNode, ABI34_0_0YGEdgeRight))
  };

  UIEdgeInsets borderWidth = (UIEdgeInsets){
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(ABI34_0_0yogaNode, ABI34_0_0YGEdgeTop)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(ABI34_0_0yogaNode, ABI34_0_0YGEdgeLeft)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(ABI34_0_0yogaNode, ABI34_0_0YGEdgeBottom)),
    ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI34_0_0YGNodeLayoutGetBorder(ABI34_0_0yogaNode, ABI34_0_0YGEdgeRight))
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
  layoutMetrics.displayType = ABI34_0_0RCTReactABI34_0_0DisplayTypeFromYogaDisplayType(ABI34_0_0YGNodeStyleGetDisplay(ABI34_0_0yogaNode));
  layoutMetrics.layoutDirection = ABI34_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI34_0_0YGNodeLayoutGetDirection(ABI34_0_0yogaNode));

  return layoutMetrics;
}


/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI34_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI34_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI34_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI34_0_0RCTCoreGraphicsFloatFromYogaValue(ABI34_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI34_0_0YGUnitPoint:
      return ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI34_0_0YGUnitPercent:
      return ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI34_0_0YGUnitAuto:
    case ABI34_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI34_0_0YGDirection ABI34_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI34_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI34_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI34_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI34_0_0YGDirection direction)
{
  switch (direction) {
    case ABI34_0_0YGDirectionInherit:
    case ABI34_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI34_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI34_0_0YGDisplay ABI34_0_0RCTYogaDisplayTypeFromReactABI34_0_0DisplayType(ABI34_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI34_0_0RCTDisplayTypeNone:
      return ABI34_0_0YGDisplayNone;
    case ABI34_0_0RCTDisplayTypeFlex:
      return ABI34_0_0YGDisplayFlex;
    case ABI34_0_0RCTDisplayTypeInline:
      ABI34_0_0RCTAssert(NO, @"ABI34_0_0RCTDisplayTypeInline cannot be converted to ABI34_0_0YGDisplay value.");
      return ABI34_0_0YGDisplayNone;
  }
}

ABI34_0_0RCTDisplayType ABI34_0_0RCTReactABI34_0_0DisplayTypeFromYogaDisplayType(ABI34_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI34_0_0YGDisplayFlex:
      return ABI34_0_0RCTDisplayTypeFlex;
    case ABI34_0_0YGDisplayNone:
      return ABI34_0_0RCTDisplayTypeNone;
  }
}
