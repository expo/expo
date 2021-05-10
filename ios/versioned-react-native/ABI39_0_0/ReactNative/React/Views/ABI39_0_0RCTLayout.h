/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI39_0_0React/ABI39_0_0RCTDefines.h>
#import <ABI39_0_0yoga/ABI39_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI39_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI39_0_0RCTDisplayType) {
  ABI39_0_0RCTDisplayTypeNone,
  ABI39_0_0RCTDisplayTypeFlex,
  ABI39_0_0RCTDisplayTypeInline,
};

struct ABI39_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI39_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI39_0_0RCTLayoutMetrics ABI39_0_0RCTLayoutMetrics;

struct ABI39_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI39_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI39_0_0RCTLayoutContext ABI39_0_0RCTLayoutContext;

static inline BOOL ABI39_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI39_0_0RCTLayoutMetrics a, ABI39_0_0RCTLayoutMetrics b)
{
  return CGRectEqualToRect(a.frame, b.frame) && CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
      UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) && a.displayType == b.displayType &&
      a.layoutDirection == b.layoutDirection;
}

ABI39_0_0RCT_EXTERN ABI39_0_0RCTLayoutMetrics ABI39_0_0RCTLayoutMetricsFromYogaNode(ABI39_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI39_0_0RCT_EXTERN float ABI39_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI39_0_0RCT_EXTERN CGFloat ABI39_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI39_0_0YGValue` to simple `CGFloat` value.
 */
ABI39_0_0RCT_EXTERN CGFloat ABI39_0_0RCTCoreGraphicsFloatFromYogaValue(ABI39_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI39_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI39_0_0RCT_EXTERN ABI39_0_0YGDirection ABI39_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI39_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI39_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI39_0_0YGDirection direction);

/**
 * Converts `ABI39_0_0YGDisplay` to `ABI39_0_0RCTDisplayType` and vise versa.
 */
ABI39_0_0RCT_EXTERN ABI39_0_0YGDisplay ABI39_0_0RCTYogaDisplayTypeFromABI39_0_0ReactDisplayType(ABI39_0_0RCTDisplayType displayType);
ABI39_0_0RCT_EXTERN ABI39_0_0RCTDisplayType ABI39_0_0RCTABI39_0_0ReactDisplayTypeFromYogaDisplayType(ABI39_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
