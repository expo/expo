/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI31_0_0/ABI31_0_0RCTDefines.h>
#import <ABI31_0_0yoga/ABI31_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI31_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI31_0_0RCTDisplayType) {
  ABI31_0_0RCTDisplayTypeNone,
  ABI31_0_0RCTDisplayTypeFlex,
  ABI31_0_0RCTDisplayTypeInline,
};

struct ABI31_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI31_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI31_0_0RCTLayoutMetrics ABI31_0_0RCTLayoutMetrics;

struct ABI31_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI31_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI31_0_0RCTLayoutContext ABI31_0_0RCTLayoutContext;

static inline BOOL ABI31_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI31_0_0RCTLayoutMetrics a, ABI31_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI31_0_0RCT_EXTERN ABI31_0_0RCTLayoutMetrics ABI31_0_0RCTLayoutMetricsFromYogaNode(ABI31_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI31_0_0RCT_EXTERN float ABI31_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI31_0_0RCT_EXTERN CGFloat ABI31_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI31_0_0YGValue` to simple `CGFloat` value.
 */
ABI31_0_0RCT_EXTERN CGFloat ABI31_0_0RCTCoreGraphicsFloatFromYogaValue(ABI31_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI31_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI31_0_0RCT_EXTERN ABI31_0_0YGDirection ABI31_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI31_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI31_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI31_0_0YGDirection direction);

/**
 * Converts `ABI31_0_0YGDisplay` to `ABI31_0_0RCTDisplayType` and vise versa.
 */
ABI31_0_0RCT_EXTERN ABI31_0_0YGDisplay ABI31_0_0RCTYogaDisplayTypeFromReactABI31_0_0DisplayType(ABI31_0_0RCTDisplayType displayType);
ABI31_0_0RCT_EXTERN ABI31_0_0RCTDisplayType ABI31_0_0RCTReactABI31_0_0DisplayTypeFromYogaDisplayType(ABI31_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
