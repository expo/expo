/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI33_0_0/ABI33_0_0RCTDefines.h>
#import <ABI33_0_0yoga/ABI33_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI33_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI33_0_0RCTDisplayType) {
  ABI33_0_0RCTDisplayTypeNone,
  ABI33_0_0RCTDisplayTypeFlex,
  ABI33_0_0RCTDisplayTypeInline,
};

struct ABI33_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI33_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI33_0_0RCTLayoutMetrics ABI33_0_0RCTLayoutMetrics;

struct ABI33_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI33_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI33_0_0RCTLayoutContext ABI33_0_0RCTLayoutContext;

static inline BOOL ABI33_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI33_0_0RCTLayoutMetrics a, ABI33_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI33_0_0RCT_EXTERN ABI33_0_0RCTLayoutMetrics ABI33_0_0RCTLayoutMetricsFromYogaNode(ABI33_0_0YGNodeRef ABI33_0_0yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI33_0_0RCT_EXTERN float ABI33_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI33_0_0RCT_EXTERN CGFloat ABI33_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI33_0_0YGValue` to simple `CGFloat` value.
 */
ABI33_0_0RCT_EXTERN CGFloat ABI33_0_0RCTCoreGraphicsFloatFromYogaValue(ABI33_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI33_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI33_0_0RCT_EXTERN ABI33_0_0YGDirection ABI33_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI33_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI33_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI33_0_0YGDirection direction);

/**
 * Converts `ABI33_0_0YGDisplay` to `ABI33_0_0RCTDisplayType` and vise versa.
 */
ABI33_0_0RCT_EXTERN ABI33_0_0YGDisplay ABI33_0_0RCTYogaDisplayTypeFromReactABI33_0_0DisplayType(ABI33_0_0RCTDisplayType displayType);
ABI33_0_0RCT_EXTERN ABI33_0_0RCTDisplayType ABI33_0_0RCTReactABI33_0_0DisplayTypeFromYogaDisplayType(ABI33_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
