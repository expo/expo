/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTDefines.h>
#import <ABI42_0_0yoga/ABI42_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI42_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI42_0_0RCTDisplayType) {
  ABI42_0_0RCTDisplayTypeNone,
  ABI42_0_0RCTDisplayTypeFlex,
  ABI42_0_0RCTDisplayTypeInline,
};

struct ABI42_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI42_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI42_0_0RCTLayoutMetrics ABI42_0_0RCTLayoutMetrics;

struct ABI42_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI42_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI42_0_0RCTLayoutContext ABI42_0_0RCTLayoutContext;

static inline BOOL ABI42_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI42_0_0RCTLayoutMetrics a, ABI42_0_0RCTLayoutMetrics b)
{
  return CGRectEqualToRect(a.frame, b.frame) && CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
      UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) && a.displayType == b.displayType &&
      a.layoutDirection == b.layoutDirection;
}

ABI42_0_0RCT_EXTERN ABI42_0_0RCTLayoutMetrics ABI42_0_0RCTLayoutMetricsFromYogaNode(ABI42_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI42_0_0RCT_EXTERN float ABI42_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI42_0_0RCT_EXTERN CGFloat ABI42_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI42_0_0YGValue` to simple `CGFloat` value.
 */
ABI42_0_0RCT_EXTERN CGFloat ABI42_0_0RCTCoreGraphicsFloatFromYogaValue(ABI42_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI42_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI42_0_0RCT_EXTERN ABI42_0_0YGDirection ABI42_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI42_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI42_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI42_0_0YGDirection direction);

/**
 * Converts `ABI42_0_0YGDisplay` to `ABI42_0_0RCTDisplayType` and vise versa.
 */
ABI42_0_0RCT_EXTERN ABI42_0_0YGDisplay ABI42_0_0RCTYogaDisplayTypeFromABI42_0_0ReactDisplayType(ABI42_0_0RCTDisplayType displayType);
ABI42_0_0RCT_EXTERN ABI42_0_0RCTDisplayType ABI42_0_0RCTABI42_0_0ReactDisplayTypeFromYogaDisplayType(ABI42_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
