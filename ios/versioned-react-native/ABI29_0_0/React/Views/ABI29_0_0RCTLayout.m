/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI29_0_0yoga/ABI29_0_0Yoga.h>

#import "ABI29_0_0RCTAssert.h"
#import "ABI29_0_0RCTShadowView+Layout.h"

ABI29_0_0RCTLayoutMetrics ABI29_0_0RCTLayoutMetricsFromYogaNode(ABI29_0_0YGNodeRef yogaNode)
{
  ABI29_0_0RCTLayoutMetrics layoutMetrics;

  CGRect frame = (CGRect){
    (CGPoint){
      ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetLeft(yogaNode)),
      ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetTop(yogaNode))
    },
    (CGSize){
      ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetWidth(yogaNode)),
      ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetHeight(yogaNode))
    }
  };

  UIEdgeInsets padding = (UIEdgeInsets){
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetPadding(yogaNode, ABI29_0_0YGEdgeTop)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetPadding(yogaNode, ABI29_0_0YGEdgeLeft)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetPadding(yogaNode, ABI29_0_0YGEdgeBottom)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetPadding(yogaNode, ABI29_0_0YGEdgeRight))
  };

  UIEdgeInsets borderWidth = (UIEdgeInsets){
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetBorder(yogaNode, ABI29_0_0YGEdgeTop)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetBorder(yogaNode, ABI29_0_0YGEdgeLeft)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetBorder(yogaNode, ABI29_0_0YGEdgeBottom)),
    ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(ABI29_0_0YGNodeLayoutGetBorder(yogaNode, ABI29_0_0YGEdgeRight))
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
  layoutMetrics.displayType = ABI29_0_0RCTReactABI29_0_0DisplayTypeFromYogaDisplayType(ABI29_0_0YGNodeStyleGetDisplay(yogaNode));
  layoutMetrics.layoutDirection = ABI29_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI29_0_0YGNodeLayoutGetDirection(yogaNode));

  return layoutMetrics;
}


/**
 * Yoga and CoreGraphics have different opinions about how "infinity" value
 * should be represented.
 * Yoga uses `NAN` which requires additional effort to compare all those values,
 * whereas GoreGraphics uses `GFLOAT_MAX` which can be easyly compared with
 * standard `==` operator.
 */

float ABI29_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value)
{
  if (value == CGFLOAT_MAX || isnan(value) || isinf(value)) {
    return ABI29_0_0YGUndefined;
  }

  return value;
}

CGFloat ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(float value)
{
  if (value == ABI29_0_0YGUndefined || isnan(value) || isinf(value)) {
    return CGFLOAT_MAX;
  }

  return value;
}

CGFloat ABI29_0_0RCTCoreGraphicsFloatFromYogaValue(ABI29_0_0YGValue value, CGFloat baseFloatValue)
{
  switch (value.unit) {
    case ABI29_0_0YGUnitPoint:
      return ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value);
    case ABI29_0_0YGUnitPercent:
      return ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(value.value) * baseFloatValue;
    case ABI29_0_0YGUnitAuto:
    case ABI29_0_0YGUnitUndefined:
      return baseFloatValue;
  }
}

ABI29_0_0YGDirection ABI29_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction)
{
  switch (direction) {
    case UIUserInterfaceLayoutDirectionRightToLeft:
      return ABI29_0_0YGDirectionRTL;
    case UIUserInterfaceLayoutDirectionLeftToRight:
      return ABI29_0_0YGDirectionLTR;
  }
}

UIUserInterfaceLayoutDirection ABI29_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI29_0_0YGDirection direction)
{
  switch (direction) {
    case ABI29_0_0YGDirectionInherit:
    case ABI29_0_0YGDirectionLTR:
      return UIUserInterfaceLayoutDirectionLeftToRight;
    case ABI29_0_0YGDirectionRTL:
      return UIUserInterfaceLayoutDirectionRightToLeft;
  }
}

ABI29_0_0YGDisplay ABI29_0_0RCTYogaDisplayTypeFromReactABI29_0_0DisplayType(ABI29_0_0RCTDisplayType displayType)
{
  switch (displayType) {
    case ABI29_0_0RCTDisplayTypeNone:
      return ABI29_0_0YGDisplayNone;
    case ABI29_0_0RCTDisplayTypeFlex:
      return ABI29_0_0YGDisplayFlex;
    case ABI29_0_0RCTDisplayTypeInline:
      ABI29_0_0RCTAssert(NO, @"ABI29_0_0RCTDisplayTypeInline cannot be converted to ABI29_0_0YGDisplay value.");
      return ABI29_0_0YGDisplayNone;
  }
}

ABI29_0_0RCTDisplayType ABI29_0_0RCTReactABI29_0_0DisplayTypeFromYogaDisplayType(ABI29_0_0YGDisplay displayType)
{
  switch (displayType) {
    case ABI29_0_0YGDisplayFlex:
      return ABI29_0_0RCTDisplayTypeFlex;
    case ABI29_0_0YGDisplayNone:
      return ABI29_0_0RCTDisplayTypeNone;
  }
}
