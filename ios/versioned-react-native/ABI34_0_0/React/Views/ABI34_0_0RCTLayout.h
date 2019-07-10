/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTDefines.h>
#import <ABI34_0_0yoga/ABI34_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI34_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI34_0_0RCTDisplayType) {
  ABI34_0_0RCTDisplayTypeNone,
  ABI34_0_0RCTDisplayTypeFlex,
  ABI34_0_0RCTDisplayTypeInline,
};

struct ABI34_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI34_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI34_0_0RCTLayoutMetrics ABI34_0_0RCTLayoutMetrics;

struct ABI34_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI34_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI34_0_0RCTLayoutContext ABI34_0_0RCTLayoutContext;

static inline BOOL ABI34_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI34_0_0RCTLayoutMetrics a, ABI34_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI34_0_0RCT_EXTERN ABI34_0_0RCTLayoutMetrics ABI34_0_0RCTLayoutMetricsFromYogaNode(ABI34_0_0YGNodeRef ABI34_0_0yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI34_0_0RCT_EXTERN float ABI34_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI34_0_0RCT_EXTERN CGFloat ABI34_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI34_0_0YGValue` to simple `CGFloat` value.
 */
ABI34_0_0RCT_EXTERN CGFloat ABI34_0_0RCTCoreGraphicsFloatFromYogaValue(ABI34_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI34_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI34_0_0RCT_EXTERN ABI34_0_0YGDirection ABI34_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI34_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI34_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI34_0_0YGDirection direction);

/**
 * Converts `ABI34_0_0YGDisplay` to `ABI34_0_0RCTDisplayType` and vise versa.
 */
ABI34_0_0RCT_EXTERN ABI34_0_0YGDisplay ABI34_0_0RCTYogaDisplayTypeFromReactABI34_0_0DisplayType(ABI34_0_0RCTDisplayType displayType);
ABI34_0_0RCT_EXTERN ABI34_0_0RCTDisplayType ABI34_0_0RCTReactABI34_0_0DisplayTypeFromYogaDisplayType(ABI34_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
