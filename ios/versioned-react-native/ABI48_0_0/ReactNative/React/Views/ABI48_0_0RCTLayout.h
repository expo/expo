/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>
#import <ABI48_0_0yoga/ABI48_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI48_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI48_0_0RCTDisplayType) {
  ABI48_0_0RCTDisplayTypeNone,
  ABI48_0_0RCTDisplayTypeFlex,
  ABI48_0_0RCTDisplayTypeInline,
};

struct ABI48_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI48_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI48_0_0RCTLayoutMetrics ABI48_0_0RCTLayoutMetrics;

struct ABI48_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI48_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI48_0_0RCTLayoutContext ABI48_0_0RCTLayoutContext;

static inline BOOL ABI48_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI48_0_0RCTLayoutMetrics a, ABI48_0_0RCTLayoutMetrics b)
{
  return CGRectEqualToRect(a.frame, b.frame) && CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
      UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) && a.displayType == b.displayType &&
      a.layoutDirection == b.layoutDirection;
}

ABI48_0_0RCT_EXTERN ABI48_0_0RCTLayoutMetrics ABI48_0_0RCTLayoutMetricsFromYogaNode(ABI48_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI48_0_0RCT_EXTERN float ABI48_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI48_0_0RCT_EXTERN CGFloat ABI48_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI48_0_0YGValue` to simple `CGFloat` value.
 */
ABI48_0_0RCT_EXTERN CGFloat ABI48_0_0RCTCoreGraphicsFloatFromYogaValue(ABI48_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI48_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI48_0_0RCT_EXTERN ABI48_0_0YGDirection ABI48_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI48_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI48_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI48_0_0YGDirection direction);

/**
 * Converts `ABI48_0_0YGDisplay` to `ABI48_0_0RCTDisplayType` and vise versa.
 */
ABI48_0_0RCT_EXTERN ABI48_0_0YGDisplay ABI48_0_0RCTYogaDisplayTypeFromABI48_0_0ReactDisplayType(ABI48_0_0RCTDisplayType displayType);
ABI48_0_0RCT_EXTERN ABI48_0_0RCTDisplayType ABI48_0_0RCTABI48_0_0ReactDisplayTypeFromYogaDisplayType(ABI48_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
