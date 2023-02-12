/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTDefines.h>
#import <ABI47_0_0yoga/ABI47_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI47_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI47_0_0RCTDisplayType) {
  ABI47_0_0RCTDisplayTypeNone,
  ABI47_0_0RCTDisplayTypeFlex,
  ABI47_0_0RCTDisplayTypeInline,
};

struct ABI47_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI47_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI47_0_0RCTLayoutMetrics ABI47_0_0RCTLayoutMetrics;

struct ABI47_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI47_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI47_0_0RCTLayoutContext ABI47_0_0RCTLayoutContext;

static inline BOOL ABI47_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI47_0_0RCTLayoutMetrics a, ABI47_0_0RCTLayoutMetrics b)
{
  return CGRectEqualToRect(a.frame, b.frame) && CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
      UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) && a.displayType == b.displayType &&
      a.layoutDirection == b.layoutDirection;
}

ABI47_0_0RCT_EXTERN ABI47_0_0RCTLayoutMetrics ABI47_0_0RCTLayoutMetricsFromYogaNode(ABI47_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI47_0_0RCT_EXTERN float ABI47_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI47_0_0RCT_EXTERN CGFloat ABI47_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI47_0_0YGValue` to simple `CGFloat` value.
 */
ABI47_0_0RCT_EXTERN CGFloat ABI47_0_0RCTCoreGraphicsFloatFromYogaValue(ABI47_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI47_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI47_0_0RCT_EXTERN ABI47_0_0YGDirection ABI47_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI47_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI47_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI47_0_0YGDirection direction);

/**
 * Converts `ABI47_0_0YGDisplay` to `ABI47_0_0RCTDisplayType` and vise versa.
 */
ABI47_0_0RCT_EXTERN ABI47_0_0YGDisplay ABI47_0_0RCTYogaDisplayTypeFromABI47_0_0ReactDisplayType(ABI47_0_0RCTDisplayType displayType);
ABI47_0_0RCT_EXTERN ABI47_0_0RCTDisplayType ABI47_0_0RCTABI47_0_0ReactDisplayTypeFromYogaDisplayType(ABI47_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
