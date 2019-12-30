/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0yoga/ABI36_0_0Yoga.h>

#import "ABI36_0_0RCTAssert.h"
#import "ABI36_0_0RCTShadowView+Layout.h"

ABI36_0_0RCTLayoutMetrics ABI36_0_0RCTLayoutMetricsFromYogaNode(ABI36_0_0YGNodeRef yogaNode)
{
  ABI36_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
    (CGPoint){
      ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetLeft(yogaNode)),
      ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetTop(yogaNode))
    },
    (CGSize){
      ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetWidth(yogaNode)),
      ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetHeight(yogaNode))
    }
  };

  UIEdgeInsets padding = (UIEdgeInsets){
    ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetPadding(yogaNode, ABI36_0_0YGEdgeTop)),
    ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetPadding(yogaNode, ABI36_0_0YGEdgeLeft)),
    ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetPadding(yogaNode, ABI36_0_0YGEdgeBottom)),
    ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetPadding(yogaNode, ABI36_0_0YGEdgeRight))
  };

  UIEdgeInsets borderWidth = (UIEdgeInsets){
    ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetBorder(yogaNode, ABI36_0_0YGEdgeTop)),
    ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetBorder(yogaNode, ABI36_0_0YGEdgeLeft)),
    ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetBorder(yogaNode, ABI36_0_0YGEdgeBottom)),
    ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI36_0_0YGNodeLayoutGetBorder(yogaNode, ABI36_0_0YGEdgeRight))
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
  layoutMetrics.displayType = ABI36_0_0RCTABI36_0_0ReactDisplayTypeFromYogaDisplayType(ABI36_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI36_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI36_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}


/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI36_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI36_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI36_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI36_0_0RCTCoreGraphicsFloatFromYogaValue(ABI36_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI36_0_0YGUnitPoint:
      return ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI36_0_0YGUnitPercent:
      return ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI36_0_0YGUnitAuto:
    case ABI36_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI36_0_0YGDirection ABI36_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI36_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI36_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI36_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI36_0_0YGDirection direction)
{
  switch (direction) {
    case ABI36_0_0YGDirectionInherit:
    case ABI36_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI36_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI36_0_0YGDisplay ABI36_0_0RCTYogaDisplayTypeFromABI36_0_0ReactDisplayType(ABI36_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI36_0_0RCTDisplayTypeNone:
      return ABI36_0_0YGDisplayNone;
    case ABI36_0_0RCTDisplayTypeFlex:
      return ABI36_0_0YGDisplayFlex;
    case ABI36_0_0RCTDisplayTypeInline:
      ABI36_0_0RCTAssert(NO, @"ABI36_0_0RCTDisplayTypeInline cannot be converted to ABI36_0_0YGDisplay value.");
      return ABI36_0_0YGDisplayNone;
  }
}

ABI36_0_0RCTDisplayType ABI36_0_0RCTABI36_0_0ReactDisplayTypeFromYogaDisplayType(ABI36_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI36_0_0YGDisplayFlex:
      return ABI36_0_0RCTDisplayTypeFlex;
    case ABI36_0_0YGDisplayNone:
      return ABI36_0_0RCTDisplayTypeNone;
  }
}
