/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0yoga/ABI45_0_0Yoga.h>

#import "ABI45_0_0RCTAssert.h"
#import "ABI45_0_0RCTShadowView+Layout.h"

ABI45_0_0RCTLayoutMetrics ABI45_0_0RCTLayoutMetricsFromYogaNode(ABI45_0_0YGNodeRef yogaNode)
{
  ABI45_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
      (CGPoint){
          ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetLeft(yogaNode)),
          ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetTop(yogaNode))},
      (CGSize){
          ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetWidth(yogaNode)),
          ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetHeight(yogaNode))}};

  UIEdgeInsets padding = (UIEdgeInsets){
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetPadding(yogaNode, ABI45_0_0YGEdgeTop)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetPadding(yogaNode, ABI45_0_0YGEdgeLeft)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetPadding(yogaNode, ABI45_0_0YGEdgeBottom)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetPadding(yogaNode, ABI45_0_0YGEdgeRight))};

  UIEdgeInsets borderWidth = (UIEdgeInsets){
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetBorder(yogaNode, ABI45_0_0YGEdgeTop)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetBorder(yogaNode, ABI45_0_0YGEdgeLeft)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetBorder(yogaNode, ABI45_0_0YGEdgeBottom)),
      ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI45_0_0YGNodeLayoutGetBorder(yogaNode, ABI45_0_0YGEdgeRight))};

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
  layoutMetrics.displayType = ABI45_0_0RCTABI45_0_0ReactDisplayTypeFromYogaDisplayType(ABI45_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI45_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI45_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI45_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI45_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI45_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI45_0_0RCTCoreGraphicsFloatFromYogaValue(ABI45_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI45_0_0YGUnitPoint:
      return ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI45_0_0YGUnitPercent:
      return ABI45_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI45_0_0YGUnitAuto:
    case ABI45_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI45_0_0YGDirection ABI45_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI45_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI45_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI45_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI45_0_0YGDirection direction)
{
  switch (direction) {
    case ABI45_0_0YGDirectionInherit:
    case ABI45_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI45_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI45_0_0YGDisplay ABI45_0_0RCTYogaDisplayTypeFromABI45_0_0ReactDisplayType(ABI45_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI45_0_0RCTDisplayTypeNone:
      return ABI45_0_0YGDisplayNone;
    case ABI45_0_0RCTDisplayTypeFlex:
      return ABI45_0_0YGDisplayFlex;
    case ABI45_0_0RCTDisplayTypeInline:
      ABI45_0_0RCTAssert(NO, @"ABI45_0_0RCTDisplayTypeInline cannot be converted to ABI45_0_0YGDisplay value.");
      return ABI45_0_0YGDisplayNone;
  }
}

ABI45_0_0RCTDisplayType ABI45_0_0RCTABI45_0_0ReactDisplayTypeFromYogaDisplayType(ABI45_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI45_0_0YGDisplayFlex:
      return ABI45_0_0RCTDisplayTypeFlex;
    case ABI45_0_0YGDisplayNone:
      return ABI45_0_0RCTDisplayTypeNone;
  }
}
