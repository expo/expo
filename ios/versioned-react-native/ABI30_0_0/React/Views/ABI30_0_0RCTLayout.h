/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTDefines.h>
#import <ABI30_0_0yoga/ABI30_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI30_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI30_0_0RCTDisplayType) {
  ABI30_0_0RCTDisplayTypeNone,
  ABI30_0_0RCTDisplayTypeFlex,
  ABI30_0_0RCTDisplayTypeInline,
};

struct ABI30_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI30_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI30_0_0RCTLayoutMetrics ABI30_0_0RCTLayoutMetrics;

struct ABI30_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI30_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI30_0_0RCTLayoutContext ABI30_0_0RCTLayoutContext;

static inline BOOL ABI30_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI30_0_0RCTLayoutMetrics a, ABI30_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI30_0_0RCT_EXTERN ABI30_0_0RCTLayoutMetrics ABI30_0_0RCTLayoutMetricsFromYogaNode(ABI30_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI30_0_0RCT_EXTERN float ABI30_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI30_0_0RCT_EXTERN CGFloat ABI30_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI30_0_0YGValue` to simple `CGFloat` value.
 */
ABI30_0_0RCT_EXTERN CGFloat ABI30_0_0RCTCoreGraphicsFloatFromYogaValue(ABI30_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI30_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI30_0_0RCT_EXTERN ABI30_0_0YGDirection ABI30_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI30_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI30_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI30_0_0YGDirection direction);

/**
 * Converts `ABI30_0_0YGDisplay` to `ABI30_0_0RCTDisplayType` and vise versa.
 */
ABI30_0_0RCT_EXTERN ABI30_0_0YGDisplay ABI30_0_0RCTYogaDisplayTypeFromReactABI30_0_0DisplayType(ABI30_0_0RCTDisplayType displayType);
ABI30_0_0RCT_EXTERN ABI30_0_0RCTDisplayType ABI30_0_0RCTReactABI30_0_0DisplayTypeFromYogaDisplayType(ABI30_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
