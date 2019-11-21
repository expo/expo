/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI36_0_0React/ABI36_0_0RCTDefines.h>
#import <ABI36_0_0yoga/ABI36_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI36_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI36_0_0RCTDisplayType) {
  ABI36_0_0RCTDisplayTypeNone,
  ABI36_0_0RCTDisplayTypeFlex,
  ABI36_0_0RCTDisplayTypeInline,
};

struct ABI36_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI36_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI36_0_0RCTLayoutMetrics ABI36_0_0RCTLayoutMetrics;

struct ABI36_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI36_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI36_0_0RCTLayoutContext ABI36_0_0RCTLayoutContext;

static inline BOOL ABI36_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI36_0_0RCTLayoutMetrics a, ABI36_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI36_0_0RCT_EXTERN ABI36_0_0RCTLayoutMetrics ABI36_0_0RCTLayoutMetricsFromYogaNode(ABI36_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI36_0_0RCT_EXTERN float ABI36_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI36_0_0RCT_EXTERN CGFloat ABI36_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI36_0_0YGValue` to simple `CGFloat` value.
 */
ABI36_0_0RCT_EXTERN CGFloat ABI36_0_0RCTCoreGraphicsFloatFromYogaValue(ABI36_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI36_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI36_0_0RCT_EXTERN ABI36_0_0YGDirection ABI36_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI36_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI36_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI36_0_0YGDirection direction);

/**
 * Converts `ABI36_0_0YGDisplay` to `ABI36_0_0RCTDisplayType` and vise versa.
 */
ABI36_0_0RCT_EXTERN ABI36_0_0YGDisplay ABI36_0_0RCTYogaDisplayTypeFromABI36_0_0ReactDisplayType(ABI36_0_0RCTDisplayType displayType);
ABI36_0_0RCT_EXTERN ABI36_0_0RCTDisplayType ABI36_0_0RCTABI36_0_0ReactDisplayTypeFromYogaDisplayType(ABI36_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
