/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTDefines.h>
#import <ABI41_0_0yoga/ABI41_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI41_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI41_0_0RCTDisplayType) {
  ABI41_0_0RCTDisplayTypeNone,
  ABI41_0_0RCTDisplayTypeFlex,
  ABI41_0_0RCTDisplayTypeInline,
};

struct ABI41_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI41_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI41_0_0RCTLayoutMetrics ABI41_0_0RCTLayoutMetrics;

struct ABI41_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI41_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI41_0_0RCTLayoutContext ABI41_0_0RCTLayoutContext;

static inline BOOL ABI41_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI41_0_0RCTLayoutMetrics a, ABI41_0_0RCTLayoutMetrics b)
{
  return CGRectEqualToRect(a.frame, b.frame) && CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
      UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) && a.displayType == b.displayType &&
      a.layoutDirection == b.layoutDirection;
}

ABI41_0_0RCT_EXTERN ABI41_0_0RCTLayoutMetrics ABI41_0_0RCTLayoutMetricsFromYogaNode(ABI41_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI41_0_0RCT_EXTERN float ABI41_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI41_0_0RCT_EXTERN CGFloat ABI41_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI41_0_0YGValue` to simple `CGFloat` value.
 */
ABI41_0_0RCT_EXTERN CGFloat ABI41_0_0RCTCoreGraphicsFloatFromYogaValue(ABI41_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI41_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI41_0_0RCT_EXTERN ABI41_0_0YGDirection ABI41_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI41_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI41_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI41_0_0YGDirection direction);

/**
 * Converts `ABI41_0_0YGDisplay` to `ABI41_0_0RCTDisplayType` and vise versa.
 */
ABI41_0_0RCT_EXTERN ABI41_0_0YGDisplay ABI41_0_0RCTYogaDisplayTypeFromABI41_0_0ReactDisplayType(ABI41_0_0RCTDisplayType displayType);
ABI41_0_0RCT_EXTERN ABI41_0_0RCTDisplayType ABI41_0_0RCTABI41_0_0ReactDisplayTypeFromYogaDisplayType(ABI41_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
