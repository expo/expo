/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>
#import <ABI49_0_0yoga/ABI49_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI49_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI49_0_0RCTDisplayType) {
  ABI49_0_0RCTDisplayTypeNone,
  ABI49_0_0RCTDisplayTypeFlex,
  ABI49_0_0RCTDisplayTypeInline,
};

struct ABI49_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI49_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI49_0_0RCTLayoutMetrics ABI49_0_0RCTLayoutMetrics;

struct ABI49_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI49_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI49_0_0RCTLayoutContext ABI49_0_0RCTLayoutContext;

static inline BOOL ABI49_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI49_0_0RCTLayoutMetrics a, ABI49_0_0RCTLayoutMetrics b)
{
  return CGRectEqualToRect(a.frame, b.frame) && CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
      UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) && a.displayType == b.displayType &&
      a.layoutDirection == b.layoutDirection;
}

ABI49_0_0RCT_EXTERN ABI49_0_0RCTLayoutMetrics ABI49_0_0RCTLayoutMetricsFromYogaNode(ABI49_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI49_0_0RCT_EXTERN float ABI49_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI49_0_0RCT_EXTERN CGFloat ABI49_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI49_0_0YGValue` to simple `CGFloat` value.
 */
ABI49_0_0RCT_EXTERN CGFloat ABI49_0_0RCTCoreGraphicsFloatFromYogaValue(ABI49_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI49_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI49_0_0RCT_EXTERN ABI49_0_0YGDirection ABI49_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI49_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI49_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI49_0_0YGDirection direction);

/**
 * Converts `ABI49_0_0YGDisplay` to `ABI49_0_0RCTDisplayType` and vise versa.
 */
ABI49_0_0RCT_EXTERN ABI49_0_0YGDisplay ABI49_0_0RCTYogaDisplayTypeFromABI49_0_0ReactDisplayType(ABI49_0_0RCTDisplayType displayType);
ABI49_0_0RCT_EXTERN ABI49_0_0RCTDisplayType ABI49_0_0RCTABI49_0_0ReactDisplayTypeFromYogaDisplayType(ABI49_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
