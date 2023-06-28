/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0yoga/ABI49_0_0Yoga.h>

#import "ABI49_0_0RCTAssert.h"
#import "ABI49_0_0RCTShadowView+Layout.h"

ABI49_0_0RCTLayoutMetrics ABI49_0_0RCTLayoutMetricsFromYogaNode(ABI49_0_0YGNodeRef yogaNode)
{
  ABI49_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
      (CGPoint){
          ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetLeft(yogaNode)),
          ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetTop(yogaNode))},
      (CGSize){
          ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetWidth(yogaNode)),
          ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetHeight(yogaNode))}};

  UIEdgeInsets padding = (UIEdgeInsets){
      ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetPadding(yogaNode, ABI49_0_0YGEdgeTop)),
      ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetPadding(yogaNode, ABI49_0_0YGEdgeLeft)),
      ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetPadding(yogaNode, ABI49_0_0YGEdgeBottom)),
      ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetPadding(yogaNode, ABI49_0_0YGEdgeRight))};

  UIEdgeInsets borderWidth = (UIEdgeInsets){
      ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetBorder(yogaNode, ABI49_0_0YGEdgeTop)),
      ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetBorder(yogaNode, ABI49_0_0YGEdgeLeft)),
      ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetBorder(yogaNode, ABI49_0_0YGEdgeBottom)),
      ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI49_0_0YGNodeLayoutGetBorder(yogaNode, ABI49_0_0YGEdgeRight))};

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
  layoutMetrics.displayType = ABI49_0_0RCTABI49_0_0ReactDisplayTypeFromYogaDisplayType(ABI49_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI49_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI49_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI49_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI49_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI49_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI49_0_0RCTCoreGraphicsFloatFromYogaValue(ABI49_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI49_0_0YGUnitPoint:
      return ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI49_0_0YGUnitPercent:
      return ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI49_0_0YGUnitAuto:
    case ABI49_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI49_0_0YGDirection ABI49_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI49_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI49_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI49_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI49_0_0YGDirection direction)
{
  switch (direction) {
    case ABI49_0_0YGDirectionInherit:
    case ABI49_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI49_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI49_0_0YGDisplay ABI49_0_0RCTYogaDisplayTypeFromABI49_0_0ReactDisplayType(ABI49_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI49_0_0RCTDisplayTypeNone:
      return ABI49_0_0YGDisplayNone;
    case ABI49_0_0RCTDisplayTypeFlex:
      return ABI49_0_0YGDisplayFlex;
    case ABI49_0_0RCTDisplayTypeInline:
      ABI49_0_0RCTAssert(NO, @"ABI49_0_0RCTDisplayTypeInline cannot be converted to ABI49_0_0YGDisplay value.");
      return ABI49_0_0YGDisplayNone;
  }
}

ABI49_0_0RCTDisplayType ABI49_0_0RCTABI49_0_0ReactDisplayTypeFromYogaDisplayType(ABI49_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI49_0_0YGDisplayFlex:
      return ABI49_0_0RCTDisplayTypeFlex;
    case ABI49_0_0YGDisplayNone:
      return ABI49_0_0RCTDisplayTypeNone;
  }
}
