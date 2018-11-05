/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI28_0_0/ABI28_0_0RCTDefines.h>
#import <YogaABI28_0_0/ABI28_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI28_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI28_0_0RCTDisplayType) {
  ABI28_0_0RCTDisplayTypeNone,
  ABI28_0_0RCTDisplayTypeFlex,
  ABI28_0_0RCTDisplayTypeInline,
};

struct ABI28_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI28_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI28_0_0RCTLayoutMetrics ABI28_0_0RCTLayoutMetrics;

struct ABI28_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI28_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI28_0_0RCTLayoutContext ABI28_0_0RCTLayoutContext;

static inline BOOL ABI28_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI28_0_0RCTLayoutMetrics a, ABI28_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI28_0_0RCT_EXTERN ABI28_0_0RCTLayoutMetrics ABI28_0_0RCTLayoutMetricsFromYogaNode(ABI28_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI28_0_0RCT_EXTERN float ABI28_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI28_0_0RCT_EXTERN CGFloat ABI28_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI28_0_0YGValue` to simple `CGFloat` value.
 */
ABI28_0_0RCT_EXTERN CGFloat ABI28_0_0RCTCoreGraphicsFloatFromYogaValue(ABI28_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI28_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI28_0_0RCT_EXTERN ABI28_0_0YGDirection ABI28_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI28_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI28_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI28_0_0YGDirection direction);

/**
 * Converts `ABI28_0_0YGDisplay` to `ABI28_0_0RCTDisplayType` and vise versa.
 */
ABI28_0_0RCT_EXTERN ABI28_0_0YGDisplay ABI28_0_0RCTYogaDisplayTypeFromReactABI28_0_0DisplayType(ABI28_0_0RCTDisplayType displayType);
ABI28_0_0RCT_EXTERN ABI28_0_0RCTDisplayType ABI28_0_0RCTReactABI28_0_0DisplayTypeFromYogaDisplayType(ABI28_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
