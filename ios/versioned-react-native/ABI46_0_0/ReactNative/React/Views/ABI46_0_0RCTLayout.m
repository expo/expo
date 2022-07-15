/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0yoga/ABI46_0_0Yoga.h>

#import "ABI46_0_0RCTAssert.h"
#import "ABI46_0_0RCTShadowView+Layout.h"

ABI46_0_0RCTLayoutMetrics ABI46_0_0RCTLayoutMetricsFromYogaNode(ABI46_0_0YGNodeRef yogaNode)
{
  ABI46_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
      (CGPoint){
          ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetLeft(yogaNode)),
          ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetTop(yogaNode))},
      (CGSize){
          ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetWidth(yogaNode)),
          ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetHeight(yogaNode))}};

  UIEdgeInsets padding = (UIEdgeInsets){
      ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetPadding(yogaNode, ABI46_0_0YGEdgeTop)),
      ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetPadding(yogaNode, ABI46_0_0YGEdgeLeft)),
      ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetPadding(yogaNode, ABI46_0_0YGEdgeBottom)),
      ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetPadding(yogaNode, ABI46_0_0YGEdgeRight))};

  UIEdgeInsets borderWidth = (UIEdgeInsets){
      ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetBorder(yogaNode, ABI46_0_0YGEdgeTop)),
      ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetBorder(yogaNode, ABI46_0_0YGEdgeLeft)),
      ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetBorder(yogaNode, ABI46_0_0YGEdgeBottom)),
      ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI46_0_0YGNodeLayoutGetBorder(yogaNode, ABI46_0_0YGEdgeRight))};

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
  layoutMetrics.displayType = ABI46_0_0RCTABI46_0_0ReactDisplayTypeFromYogaDisplayType(ABI46_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI46_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI46_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}

/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI46_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI46_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI46_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI46_0_0RCTCoreGraphicsFloatFromYogaValue(ABI46_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI46_0_0YGUnitPoint:
      return ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI46_0_0YGUnitPercent:
      return ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI46_0_0YGUnitAuto:
    case ABI46_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI46_0_0YGDirection ABI46_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI46_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI46_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI46_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI46_0_0YGDirection direction)
{
  switch (direction) {
    case ABI46_0_0YGDirectionInherit:
    case ABI46_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI46_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI46_0_0YGDisplay ABI46_0_0RCTYogaDisplayTypeFromABI46_0_0ReactDisplayType(ABI46_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI46_0_0RCTDisplayTypeNone:
      return ABI46_0_0YGDisplayNone;
    case ABI46_0_0RCTDisplayTypeFlex:
      return ABI46_0_0YGDisplayFlex;
    case ABI46_0_0RCTDisplayTypeInline:
      ABI46_0_0RCTAssert(NO, @"ABI46_0_0RCTDisplayTypeInline cannot be converted to ABI46_0_0YGDisplay value.");
      return ABI46_0_0YGDisplayNone;
  }
}

ABI46_0_0RCTDisplayType ABI46_0_0RCTABI46_0_0ReactDisplayTypeFromYogaDisplayType(ABI46_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI46_0_0YGDisplayFlex:
      return ABI46_0_0RCTDisplayTypeFlex;
    case ABI46_0_0YGDisplayNone:
      return ABI46_0_0RCTDisplayTypeNone;
  }
}
