/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI32_0_0/ABI32_0_0RCTDefines.h>
#import <ABI32_0_0yoga/ABI32_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI32_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI32_0_0RCTDisplayType) {
  ABI32_0_0RCTDisplayTypeNone,
  ABI32_0_0RCTDisplayTypeFlex,
  ABI32_0_0RCTDisplayTypeInline,
};

struct ABI32_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI32_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI32_0_0RCTLayoutMetrics ABI32_0_0RCTLayoutMetrics;

struct ABI32_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI32_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI32_0_0RCTLayoutContext ABI32_0_0RCTLayoutContext;

static inline BOOL ABI32_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI32_0_0RCTLayoutMetrics a, ABI32_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI32_0_0RCT_EXTERN ABI32_0_0RCTLayoutMetrics ABI32_0_0RCTLayoutMetricsFromYogaNode(ABI32_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI32_0_0RCT_EXTERN float ABI32_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI32_0_0RCT_EXTERN CGFloat ABI32_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI32_0_0YGValue` to simple `CGFloat` value.
 */
ABI32_0_0RCT_EXTERN CGFloat ABI32_0_0RCTCoreGraphicsFloatFromYogaValue(ABI32_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI32_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI32_0_0RCT_EXTERN ABI32_0_0YGDirection ABI32_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI32_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI32_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI32_0_0YGDirection direction);

/**
 * Converts `ABI32_0_0YGDisplay` to `ABI32_0_0RCTDisplayType` and vise versa.
 */
ABI32_0_0RCT_EXTERN ABI32_0_0YGDisplay ABI32_0_0RCTYogaDisplayTypeFromReactABI32_0_0DisplayType(ABI32_0_0RCTDisplayType displayType);
ABI32_0_0RCT_EXTERN ABI32_0_0RCTDisplayType ABI32_0_0RCTReactABI32_0_0DisplayTypeFromYogaDisplayType(ABI32_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
