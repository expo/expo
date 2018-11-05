/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI29_0_0/ABI29_0_0RCTDefines.h>
#import <ABI29_0_0yoga/ABI29_0_0Yoga.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI29_0_0RCTShadowView;

typedef NS_ENUM(NSInteger, ABI29_0_0RCTDisplayType) {
  ABI29_0_0RCTDisplayTypeNone,
  ABI29_0_0RCTDisplayTypeFlex,
  ABI29_0_0RCTDisplayTypeInline,
};

struct ABI29_0_0RCTLayoutMetrics {
  CGRect frame;
  CGRect contentFrame;
  UIEdgeInsets borderWidth;
  ABI29_0_0RCTDisplayType displayType;
  UIUserInterfaceLayoutDirection layoutDirection;
};
typedef struct CG_BOXABLE ABI29_0_0RCTLayoutMetrics ABI29_0_0RCTLayoutMetrics;

struct ABI29_0_0RCTLayoutContext {
  CGPoint absolutePosition;
  __unsafe_unretained NSHashTable<ABI29_0_0RCTShadowView *> *_Nonnull affectedShadowViews;
  __unsafe_unretained NSHashTable<NSString *> *_Nonnull other;
};
typedef struct CG_BOXABLE ABI29_0_0RCTLayoutContext ABI29_0_0RCTLayoutContext;

static inline BOOL ABI29_0_0RCTLayoutMetricsEqualToLayoutMetrics(ABI29_0_0RCTLayoutMetrics a, ABI29_0_0RCTLayoutMetrics b)
{
  return
    CGRectEqualToRect(a.frame, b.frame) &&
    CGRectEqualToRect(a.contentFrame, b.contentFrame) &&
    UIEdgeInsetsEqualToEdgeInsets(a.borderWidth, b.borderWidth) &&
    a.displayType == b.displayType &&
    a.layoutDirection == b.layoutDirection;
}

ABI29_0_0RCT_EXTERN ABI29_0_0RCTLayoutMetrics ABI29_0_0RCTLayoutMetricsFromYogaNode(ABI29_0_0YGNodeRef yogaNode);

/**
 * Converts float values between Yoga and CoreGraphics representations,
 * especially in terms of edge cases.
 */
ABI29_0_0RCT_EXTERN float ABI29_0_0RCTYogaFloatFromCoreGraphicsFloat(CGFloat value);
ABI29_0_0RCT_EXTERN CGFloat ABI29_0_0RCTCoreGraphicsFloatFromYogaFloat(float value);

/**
 * Converts compound `ABI29_0_0YGValue` to simple `CGFloat` value.
 */
ABI29_0_0RCT_EXTERN CGFloat ABI29_0_0RCTCoreGraphicsFloatFromYogaValue(ABI29_0_0YGValue value, CGFloat baseFloatValue);

/**
 * Converts `ABI29_0_0YGDirection` to `UIUserInterfaceLayoutDirection` and vise versa.
 */
ABI29_0_0RCT_EXTERN ABI29_0_0YGDirection ABI29_0_0RCTYogaLayoutDirectionFromUIKitLayoutDirection(UIUserInterfaceLayoutDirection direction);
ABI29_0_0RCT_EXTERN UIUserInterfaceLayoutDirection ABI29_0_0RCTUIKitLayoutDirectionFromYogaLayoutDirection(ABI29_0_0YGDirection direction);

/**
 * Converts `ABI29_0_0YGDisplay` to `ABI29_0_0RCTDisplayType` and vise versa.
 */
ABI29_0_0RCT_EXTERN ABI29_0_0YGDisplay ABI29_0_0RCTYogaDisplayTypeFromReactABI29_0_0DisplayType(ABI29_0_0RCTDisplayType displayType);
ABI29_0_0RCT_EXTERN ABI29_0_0RCTDisplayType ABI29_0_0RCTReactABI29_0_0DisplayTypeFromYogaDisplayType(ABI29_0_0YGDisplay displayType);

NS_ASSUME_NONNULL_END
