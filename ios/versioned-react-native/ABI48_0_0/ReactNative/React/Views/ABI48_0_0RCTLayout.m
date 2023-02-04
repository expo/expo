/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0yoga/ABI48_0_0Yoga.h>

#import "ABI48_0_0RCTAssert.h"
#import "ABI48_0_0RCTShadowView+Layout.h"

ABI48_0_0RCTLayoutMetrics ABI48_0_0RCTLayoutMetricsFromYogaNode(ABI48_0_0YGNodeRef yogaNode)
{
  ABI48_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
      (CGPoint){
          ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetLeft(yogaNode)),
          ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetTop(yogaNode))},
      (CGSize){
          ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetWidth(yogaNode)),
          ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetHeight(yogaNode))}};

  UIEdgeInsets padding = (UIEdgeInsets){
      ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetPadding(yogaNode, ABI48_0_0YGEdgeTop)),
      ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetPadding(yogaNode, ABI48_0_0YGEdgeLeft)),
      ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetPadding(yogaNode, ABI48_0_0YGEdgeBottom)),
      ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetPadding(yogaNode, ABI48_0_0YGEdgeRight))};

  UIEdgeInsets borderWidth = (UIEdgeInsets){
      ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetBorder(yogaNode, ABI48_0_0YGEdgeTop)),
      ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetBorder(yogaNode, ABI48_0_0YGEdgeLeft)),
      ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetBorder(yogaNode, ABI48_0_0YGEdgeBottom)),
      ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI48_0_0YGNodeLayoutGetBorder(yogaNode, ABI48_0_0YGEdgeRight))};

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
  layoutMetrics.displayType = ABI48_0_0RCTABI48_0_0ReactDisplayTypeFromYogaDisplayType(ABI48_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI48_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI48_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI48_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI48_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI48_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI48_0_0RCTCoreGraphicsFloatFromYogaValue(ABI48_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI48_0_0YGUnitPoint:
      return ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI48_0_0YGUnitPercent:
      return ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI48_0_0YGUnitAuto:
    case ABI48_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI48_0_0YGDirection ABI48_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI48_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI48_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI48_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI48_0_0YGDirection direction)
{
  switch (direction) {
    case ABI48_0_0YGDirectionInherit:
    case ABI48_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI48_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI48_0_0YGDisplay ABI48_0_0RCTYogaDisplayTypeFromABI48_0_0ReactDisplayType(ABI48_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI48_0_0RCTDisplayTypeNone:
      return ABI48_0_0YGDisplayNone;
    case ABI48_0_0RCTDisplayTypeFlex:
      return ABI48_0_0YGDisplayFlex;
    case ABI48_0_0RCTDisplayTypeInline:
      ABI48_0_0RCTAssert(NO, @"ABI48_0_0RCTDisplayTypeInline cannot be converted to ABI48_0_0YGDisplay value.");
      return ABI48_0_0YGDisplayNone;
  }
}

ABI48_0_0RCTDisplayType ABI48_0_0RCTABI48_0_0ReactDisplayTypeFromYogaDisplayType(ABI48_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI48_0_0YGDisplayFlex:
      return ABI48_0_0RCTDisplayTypeFlex;
    case ABI48_0_0YGDisplayNone:
      return ABI48_0_0RCTDisplayTypeNone;
  }
}
