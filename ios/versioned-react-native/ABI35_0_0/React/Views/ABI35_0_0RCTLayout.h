/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI35_0_0/ABI35_0_0RCTDefines.h>
#import <ABI35_0_0yoga/ABI35_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI35_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI35_0_0RCTDisplayType) {
  ABI35_0_0RCTDisplayTypeNone,
  ABI35_0_0RCTDisplayTypeFlex,
  ABI35_0_0RCTDisplayTypeInline,
};

struct ABI35_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI35_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI35_0_0RCTLayoutMetrics ABI35_0_0RCTLayoutMetrics;

struct ABI35_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI35_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI35_0_0RCTLayoutContext ABI35_0_0RCTLayoutContext;

static inline BOOL ABI35_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI35_0_0RCTLayoutMetrics a, ABI35_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI35_0_0RCT_EXTERN ABI35_0_0RCTLayoutMetrics ABI35_0_0RCTLayoutMetricsFromYogaNode(ABI35_0_0YGNodeRef ABI35_0_0yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI35_0_0RCT_EXTERN float ABI35_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI35_0_0RCT_EXTERN CGFloat ABI35_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI35_0_0YGValue` to simple `CGFloat` value.
 */
ABI35_0_0RCT_EXTERN CGFloat ABI35_0_0RCTCoreGraphicsFloatFromYogaValue(ABI35_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI35_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI35_0_0RCT_EXTERN ABI35_0_0YGDirection ABI35_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI35_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI35_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI35_0_0YGDirection direction);

/**
 * Converts `ABI35_0_0YGDisplay` to `ABI35_0_0RCTDisplayType` and vise versa.
 */
ABI35_0_0RCT_EXTERN ABI35_0_0YGDisplay ABI35_0_0RCTYogaDisplayTypeFromReactABI35_0_0DisplayType(ABI35_0_0RCTDisplayType displayType);
ABI35_0_0RCT_EXTERN ABI35_0_0RCTDisplayType ABI35_0_0RCTReactABI35_0_0DisplayTypeFromYogaDisplayType(ABI35_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
