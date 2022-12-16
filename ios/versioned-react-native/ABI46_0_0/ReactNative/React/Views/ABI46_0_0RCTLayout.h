/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI46_0_0React/ABI46_0_0RCTDefines.h>
#import <ABI46_0_0yoga/ABI46_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI46_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI46_0_0RCTDisplayType) {
  ABI46_0_0RCTDisplayTypeNone,
  ABI46_0_0RCTDisplayTypeFlex,
  ABI46_0_0RCTDisplayTypeInline,
};

struct ABI46_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI46_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI46_0_0RCTLayoutMetrics ABI46_0_0RCTLayoutMetrics;

struct ABI46_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI46_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI46_0_0RCTLayoutContext ABI46_0_0RCTLayoutContext;

static inline BOOL ABI46_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI46_0_0RCTLayoutMetrics a, ABI46_0_0RCTLayoutMetrics b)
{
  return CGRectEqualToRect(a.frame, b.frame) && CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
      UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) && a.displayType == b.displayType &&
      a.layoutDirection == b.layoutDirection;
}

ABI46_0_0RCT_EXTERN ABI46_0_0RCTLayoutMetrics ABI46_0_0RCTLayoutMetricsFromYogaNode(ABI46_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI46_0_0RCT_EXTERN float ABI46_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI46_0_0RCT_EXTERN CGFloat ABI46_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI46_0_0YGValue` to simple `CGFloat` value.
 */
ABI46_0_0RCT_EXTERN CGFloat ABI46_0_0RCTCoreGraphicsFloatFromYogaValue(ABI46_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI46_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI46_0_0RCT_EXTERN ABI46_0_0YGDirection ABI46_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI46_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI46_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI46_0_0YGDirection direction);

/**
 * Converts `ABI46_0_0YGDisplay` to `ABI46_0_0RCTDisplayType` and vise versa.
 */
ABI46_0_0RCT_EXTERN ABI46_0_0YGDisplay ABI46_0_0RCTYogaDisplayTypeFromABI46_0_0ReactDisplayType(ABI46_0_0RCTDisplayType displayType);
ABI46_0_0RCT_EXTERN ABI46_0_0RCTDisplayType ABI46_0_0RCTABI46_0_0ReactDisplayTypeFromYogaDisplayType(ABI46_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
