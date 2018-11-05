/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI27_0_0/ABI27_0_0RCTDefines.h>
#import <yogaABI27_0_0/ABI27_0_0yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI27_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI27_0_0RCTDisplayType) {
  ABI27_0_0RCTDisplayTypeNone,
  ABI27_0_0RCTDisplayTypeFlex,
  ABI27_0_0RCTDisplayTypeInline,
};

struct ABI27_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI27_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI27_0_0RCTLayoutMetrics ABI27_0_0RCTLayoutMetrics;

struct ABI27_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI27_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI27_0_0RCTLayoutContext ABI27_0_0RCTLayoutContext;

static inline BOOL ABI27_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI27_0_0RCTLayoutMetrics a, ABI27_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI27_0_0RCT_EXTERN ABI27_0_0RCTLayoutMetrics ABI27_0_0RCTLayoutMetricsFromYogaNode(ABI27_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI27_0_0RCT_EXTERN float ABI27_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI27_0_0RCT_EXTERN CGFloat ABI27_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI27_0_0YGValue` to simple `CGFloat` value.
 */
ABI27_0_0RCT_EXTERN CGFloat ABI27_0_0RCTCoreGraphicsFloatFromYogaValue(ABI27_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI27_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI27_0_0RCT_EXTERN ABI27_0_0YGDirection ABI27_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI27_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI27_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI27_0_0YGDirection direction);

/**
 * Converts `ABI27_0_0YGDisplay` to `ABI27_0_0RCTDisplayType` and vise versa.
 */
ABI27_0_0RCT_EXTERN ABI27_0_0YGDisplay ABI27_0_0RCTYogaDisplayTypeFromReactABI27_0_0DisplayType(ABI27_0_0RCTDisplayType displayType);
ABI27_0_0RCT_EXTERN ABI27_0_0RCTDisplayType ABI27_0_0RCTReactABI27_0_0DisplayTypeFromYogaDisplayType(ABI27_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
