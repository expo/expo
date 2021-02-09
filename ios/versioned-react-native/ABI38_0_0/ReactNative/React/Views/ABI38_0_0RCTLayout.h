/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTDefines.h>
#import <ABI38_0_0yoga/ABI38_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI38_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI38_0_0RCTDisplayType) {
  ABI38_0_0RCTDisplayTypeNone,
  ABI38_0_0RCTDisplayTypeFlex,
  ABI38_0_0RCTDisplayTypeInline,
};

struct ABI38_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI38_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI38_0_0RCTLayoutMetrics ABI38_0_0RCTLayoutMetrics;

struct ABI38_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI38_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI38_0_0RCTLayoutContext ABI38_0_0RCTLayoutContext;

static inline BOOL ABI38_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI38_0_0RCTLayoutMetrics a, ABI38_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI38_0_0RCT_EXTERN ABI38_0_0RCTLayoutMetrics ABI38_0_0RCTLayoutMetricsFromYogaNode(ABI38_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI38_0_0RCT_EXTERN float ABI38_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI38_0_0RCT_EXTERN CGFloat ABI38_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI38_0_0YGValue` to simple `CGFloat` value.
 */
ABI38_0_0RCT_EXTERN CGFloat ABI38_0_0RCTCoreGraphicsFloatFromYogaValue(ABI38_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI38_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI38_0_0RCT_EXTERN ABI38_0_0YGDirection ABI38_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI38_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI38_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI38_0_0YGDirection direction);

/**
 * Converts `ABI38_0_0YGDisplay` to `ABI38_0_0RCTDisplayType` and vise versa.
 */
ABI38_0_0RCT_EXTERN ABI38_0_0YGDisplay ABI38_0_0RCTYogaDisplayTypeFromABI38_0_0ReactDisplayType(ABI38_0_0RCTDisplayType displayType);
ABI38_0_0RCT_EXTERN ABI38_0_0RCTDisplayType ABI38_0_0RCTABI38_0_0ReactDisplayTypeFromYogaDisplayType(ABI38_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
