/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTDefines.h>
#import <ABI43_0_0yoga/ABI43_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI43_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI43_0_0RCTDisplayType) {
  ABI43_0_0RCTDisplayTypeNone,
  ABI43_0_0RCTDisplayTypeFlex,
  ABI43_0_0RCTDisplayTypeInline,
};

struct ABI43_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI43_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI43_0_0RCTLayoutMetrics ABI43_0_0RCTLayoutMetrics;

struct ABI43_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI43_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI43_0_0RCTLayoutContext ABI43_0_0RCTLayoutContext;

static inline BOOL ABI43_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI43_0_0RCTLayoutMetrics a, ABI43_0_0RCTLayoutMetrics b)
{
  return CGRectEqualToRect(a.frame, b.frame) && CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
      UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) && a.displayType == b.displayType &&
      a.layoutDirection == b.layoutDirection;
}

ABI43_0_0RCT_EXTERN ABI43_0_0RCTLayoutMetrics ABI43_0_0RCTLayoutMetricsFromYogaNode(ABI43_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI43_0_0RCT_EXTERN float ABI43_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI43_0_0RCT_EXTERN CGFloat ABI43_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI43_0_0YGValue` to simple `CGFloat` value.
 */
ABI43_0_0RCT_EXTERN CGFloat ABI43_0_0RCTCoreGraphicsFloatFromYogaValue(ABI43_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI43_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI43_0_0RCT_EXTERN ABI43_0_0YGDirection ABI43_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI43_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI43_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI43_0_0YGDirection direction);

/**
 * Converts `ABI43_0_0YGDisplay` to `ABI43_0_0RCTDisplayType` and vise versa.
 */
ABI43_0_0RCT_EXTERN ABI43_0_0YGDisplay ABI43_0_0RCTYogaDisplayTypeFromABI43_0_0ReactDisplayType(ABI43_0_0RCTDisplayType displayType);
ABI43_0_0RCT_EXTERN ABI43_0_0RCTDisplayType ABI43_0_0RCTABI43_0_0ReactDisplayTypeFromYogaDisplayType(ABI43_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
