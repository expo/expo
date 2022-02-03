/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTDefines.h>
#import <ABI44_0_0yoga/ABI44_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI44_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI44_0_0RCTDisplayType) {
  ABI44_0_0RCTDisplayTypeNone,
  ABI44_0_0RCTDisplayTypeFlex,
  ABI44_0_0RCTDisplayTypeInline,
};

struct ABI44_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI44_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI44_0_0RCTLayoutMetrics ABI44_0_0RCTLayoutMetrics;

struct ABI44_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI44_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI44_0_0RCTLayoutContext ABI44_0_0RCTLayoutContext;

static inline BOOL ABI44_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI44_0_0RCTLayoutMetrics a, ABI44_0_0RCTLayoutMetrics b)
{
  return CGRectEqualToRect(a.frame, b.frame) && CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
      UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) && a.displayType == b.displayType &&
      a.layoutDirection == b.layoutDirection;
}

ABI44_0_0RCT_EXTERN ABI44_0_0RCTLayoutMetrics ABI44_0_0RCTLayoutMetricsFromYogaNode(ABI44_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI44_0_0RCT_EXTERN float ABI44_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI44_0_0RCT_EXTERN CGFloat ABI44_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI44_0_0YGValue` to simple `CGFloat` value.
 */
ABI44_0_0RCT_EXTERN CGFloat ABI44_0_0RCTCoreGraphicsFloatFromYogaValue(ABI44_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI44_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI44_0_0RCT_EXTERN ABI44_0_0YGDirection ABI44_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI44_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI44_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI44_0_0YGDirection direction);

/**
 * Converts `ABI44_0_0YGDisplay` to `ABI44_0_0RCTDisplayType` and vise versa.
 */
ABI44_0_0RCT_EXTERN ABI44_0_0YGDisplay ABI44_0_0RCTYogaDisplayTypeFromABI44_0_0ReactDisplayType(ABI44_0_0RCTDisplayType displayType);
ABI44_0_0RCT_EXTERN ABI44_0_0RCTDisplayType ABI44_0_0RCTABI44_0_0ReactDisplayTypeFromYogaDisplayType(ABI44_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
