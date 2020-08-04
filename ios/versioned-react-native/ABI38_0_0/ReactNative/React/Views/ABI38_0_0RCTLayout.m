/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0yoga/ABI38_0_0Yoga.h>

#import "ABI38_0_0RCTAssert.h"
#import "ABI38_0_0RCTShadowView+Layout.h"

ABI38_0_0RCTLayoutMetrics ABI38_0_0RCTLayoutMetricsFromYogaNode(ABI38_0_0YGNodeRef yogaNode)
{
  ABI38_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
    (CGPoint){
      ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetLeft(yogaNode)),
      ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetTop(yogaNode))
    },
    (CGSize){
      ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetWidth(yogaNode)),
      ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetHeight(yogaNode))
    }
  };

  UIEdgeInsets padding = (UIEdgeInsets){
    ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetPadding(yogaNode, ABI38_0_0YGEdgeTop)),
    ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetPadding(yogaNode, ABI38_0_0YGEdgeLeft)),
    ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetPadding(yogaNode, ABI38_0_0YGEdgeBottom)),
    ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetPadding(yogaNode, ABI38_0_0YGEdgeRight))
  };

  UIEdgeInsets borderWidth = (UIEdgeInsets){
    ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetBorder(yogaNode, ABI38_0_0YGEdgeTop)),
    ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetBorder(yogaNode, ABI38_0_0YGEdgeLeft)),
    ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetBorder(yogaNode, ABI38_0_0YGEdgeBottom)),
    ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI38_0_0YGNodeLayoutGetBorder(yogaNode, ABI38_0_0YGEdgeRight))
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
  layoutMetrics.displayType = ABI38_0_0RCTABI38_0_0ReactDisplayTypeFromYogaDisplayType(ABI38_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI38_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI38_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}


/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI38_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI38_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI38_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI38_0_0RCTCoreGraphicsFloatFromYogaValue(ABI38_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI38_0_0YGUnitPoint:
      return ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI38_0_0YGUnitPercent:
      return ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI38_0_0YGUnitAuto:
    case ABI38_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI38_0_0YGDirection ABI38_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI38_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI38_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI38_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI38_0_0YGDirection direction)
{
  switch (direction) {
    case ABI38_0_0YGDirectionInherit:
    case ABI38_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI38_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI38_0_0YGDisplay ABI38_0_0RCTYogaDisplayTypeFromABI38_0_0ReactDisplayType(ABI38_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI38_0_0RCTDisplayTypeNone:
      return ABI38_0_0YGDisplayNone;
    case ABI38_0_0RCTDisplayTypeFlex:
      return ABI38_0_0YGDisplayFlex;
    case ABI38_0_0RCTDisplayTypeInline:
      ABI38_0_0RCTAssert(NO, @"ABI38_0_0RCTDisplayTypeInline cannot be converted to ABI38_0_0YGDisplay value.");
      return ABI38_0_0YGDisplayNone;
  }
}

ABI38_0_0RCTDisplayType ABI38_0_0RCTABI38_0_0ReactDisplayTypeFromYogaDisplayType(ABI38_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI38_0_0YGDisplayFlex:
      return ABI38_0_0RCTDisplayTypeFlex;
    case ABI38_0_0YGDisplayNone:
      return ABI38_0_0RCTDisplayTypeNone;
  }
}
