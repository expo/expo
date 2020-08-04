/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTDefines.h>
#import <ABI37_0_0yoga/ABI37_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI37_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI37_0_0RCTDisplayType) {
  ABI37_0_0RCTDisplayTypeNone,
  ABI37_0_0RCTDisplayTypeFlex,
  ABI37_0_0RCTDisplayTypeInline,
};

struct ABI37_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI37_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI37_0_0RCTLayoutMetrics ABI37_0_0RCTLayoutMetrics;

struct ABI37_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI37_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI37_0_0RCTLayoutContext ABI37_0_0RCTLayoutContext;

static inline BOOL ABI37_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI37_0_0RCTLayoutMetrics a, ABI37_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI37_0_0RCT_EXTERN ABI37_0_0RCTLayoutMetrics ABI37_0_0RCTLayoutMetricsFromYogaNode(ABI37_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI37_0_0RCT_EXTERN float ABI37_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI37_0_0RCT_EXTERN CGFloat ABI37_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI37_0_0YGValue` to simple `CGFloat` value.
 */
ABI37_0_0RCT_EXTERN CGFloat ABI37_0_0RCTCoreGraphicsFloatFromYogaValue(ABI37_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI37_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI37_0_0RCT_EXTERN ABI37_0_0YGDirection ABI37_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI37_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI37_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI37_0_0YGDirection direction);

/**
 * Converts `ABI37_0_0YGDisplay` to `ABI37_0_0RCTDisplayType` and vise versa.
 */
ABI37_0_0RCT_EXTERN ABI37_0_0YGDisplay ABI37_0_0RCTYogaDisplayTypeFromABI37_0_0ReactDisplayType(ABI37_0_0RCTDisplayType displayType);
ABI37_0_0RCT_EXTERN ABI37_0_0RCTDisplayType ABI37_0_0RCTABI37_0_0ReactDisplayTypeFromYogaDisplayType(ABI37_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
