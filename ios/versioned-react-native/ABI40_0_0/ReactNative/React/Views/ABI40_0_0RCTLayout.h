/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI40_0_0React/ABI40_0_0RCTDefines.h>
#import <ABI40_0_0yoga/ABI40_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI40_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI40_0_0RCTDisplayType) {
  ABI40_0_0RCTDisplayTypeNone,
  ABI40_0_0RCTDisplayTypeFlex,
  ABI40_0_0RCTDisplayTypeInline,
};

struct ABI40_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI40_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI40_0_0RCTLayoutMetrics ABI40_0_0RCTLayoutMetrics;

struct ABI40_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI40_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI40_0_0RCTLayoutContext ABI40_0_0RCTLayoutContext;

static inline BOOL ABI40_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI40_0_0RCTLayoutMetrics a, ABI40_0_0RCTLayoutMetrics b)
{
  return CGRectEqualToRect(a.frame, b.frame) && CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
      UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) && a.displayType == b.displayType &&
      a.layoutDirection == b.layoutDirection;
}

ABI40_0_0RCT_EXTERN ABI40_0_0RCTLayoutMetrics ABI40_0_0RCTLayoutMetricsFromYogaNode(ABI40_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI40_0_0RCT_EXTERN float ABI40_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI40_0_0RCT_EXTERN CGFloat ABI40_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI40_0_0YGValue` to simple `CGFloat` value.
 */
ABI40_0_0RCT_EXTERN CGFloat ABI40_0_0RCTCoreGraphicsFloatFromYogaValue(ABI40_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI40_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI40_0_0RCT_EXTERN ABI40_0_0YGDirection ABI40_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI40_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI40_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI40_0_0YGDirection direction);

/**
 * Converts `ABI40_0_0YGDisplay` to `ABI40_0_0RCTDisplayType` and vise versa.
 */
ABI40_0_0RCT_EXTERN ABI40_0_0YGDisplay ABI40_0_0RCTYogaDisplayTypeFromABI40_0_0ReactDisplayType(ABI40_0_0RCTDisplayType displayType);
ABI40_0_0RCT_EXTERN ABI40_0_0RCTDisplayType ABI40_0_0RCTABI40_0_0ReactDisplayTypeFromYogaDisplayType(ABI40_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
