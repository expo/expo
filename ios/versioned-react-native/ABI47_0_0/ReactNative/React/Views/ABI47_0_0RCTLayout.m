/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0yoga/ABI47_0_0Yoga.h>

#import "ABI47_0_0RCTAssert.h"
#import "ABI47_0_0RCTShadowView+Layout.h"

ABI47_0_0RCTLayoutMetrics ABI47_0_0RCTLayoutMetricsFromYogaNode(ABI47_0_0YGNodeRef yogaNode)
{
  ABI47_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
      (CGPoint){
          ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetLeft(yogaNode)),
          ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetTop(yogaNode))},
      (CGSize){
          ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetWidth(yogaNode)),
          ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetHeight(yogaNode))}};

  UIEdgeInsets padding = (UIEdgeInsets){
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetPadding(yogaNode, ABI47_0_0YGEdgeTop)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetPadding(yogaNode, ABI47_0_0YGEdgeLeft)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetPadding(yogaNode, ABI47_0_0YGEdgeBottom)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetPadding(yogaNode, ABI47_0_0YGEdgeRight))};

  UIEdgeInsets borderWidth = (UIEdgeInsets){
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetBorder(yogaNode, ABI47_0_0YGEdgeTop)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetBorder(yogaNode, ABI47_0_0YGEdgeLeft)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetBorder(yogaNode, ABI47_0_0YGEdgeBottom)),
      ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI47_0_0YGNodeLayoutGetBorder(yogaNode, ABI47_0_0YGEdgeRight))};

  UIEdgeInsets compoundInsets = (UIEdgeInsets){
      borderWidth.top + padding.top,
      borderWidth.left + padding.left,
      borderWidth.bottom + padding.bottom,
      borderWidth.right + padding.right};

  CGRect bounds = (CGRect){CGPointZero, frame.size};
  CGRect contentFrame = UIEdgeInsetsInsetRect(bounds, compoundInsets);

  layoutMetrics.frame = frame;
  layoutMetrics.borderWidth = borderWidth;
  layoutMetrics.contentFrame = contentFrame;
  layoutMetrics.displayType = ABI47_0_0RCTABI47_0_0ReactDisplayTypeFromYogaDisplayType(ABI47_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI47_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI47_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI47_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI47_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI47_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI47_0_0RCTCoreGraphicsFloatFromYogaValue(ABI47_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI47_0_0YGUnitPoint:
      return ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI47_0_0YGUnitPercent:
      return ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI47_0_0YGUnitAuto:
    case ABI47_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI47_0_0YGDirection ABI47_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI47_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI47_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI47_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI47_0_0YGDirection direction)
{
  switch (direction) {
    case ABI47_0_0YGDirectionInherit:
    case ABI47_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI47_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI47_0_0YGDisplay ABI47_0_0RCTYogaDisplayTypeFromABI47_0_0ReactDisplayType(ABI47_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI47_0_0RCTDisplayTypeNone:
      return ABI47_0_0YGDisplayNone;
    case ABI47_0_0RCTDisplayTypeFlex:
      return ABI47_0_0YGDisplayFlex;
    case ABI47_0_0RCTDisplayTypeInline:
      ABI47_0_0RCTAssert(NO, @"ABI47_0_0RCTDisplayTypeInline cannot be converted to ABI47_0_0YGDisplay value.");
      return ABI47_0_0YGDisplayNone;
  }
}

ABI47_0_0RCTDisplayType ABI47_0_0RCTABI47_0_0ReactDisplayTypeFromYogaDisplayType(ABI47_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI47_0_0YGDisplayFlex:
      return ABI47_0_0RCTDisplayTypeFlex;
    case ABI47_0_0YGDisplayNone:
      return ABI47_0_0RCTDisplayTypeNone;
  }
}
