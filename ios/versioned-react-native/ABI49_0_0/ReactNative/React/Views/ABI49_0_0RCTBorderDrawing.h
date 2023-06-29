/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTBorderStyle.h>
#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>

typedef struct {
  CGFloat topLeft;
  CGFloat topRight;
  CGFloat bottomLeft;
  CGFloat bottomRight;
} ABI49_0_0RCTCornerRadii;

typedef struct {
  CGSize topLeft;
  CGSize topRight;
  CGSize bottomLeft;
  CGSize bottomRight;
} ABI49_0_0RCTCornerInsets;

typedef struct {
  CGColorRef top;
  CGColorRef left;
  CGColorRef bottom;
  CGColorRef right;
} ABI49_0_0RCTBorderColors;

/**
 * Determine if the border widths, colors and radii are all equal.
 */
ABI49_0_0RCT_EXTERN BOOL ABI49_0_0RCTBorderInsetsAreEqual(UIEdgeInsets borderInsets);
ABI49_0_0RCT_EXTERN BOOL ABI49_0_0RCTCornerRadiiAreEqual(ABI49_0_0RCTCornerRadii cornerRadii);
ABI49_0_0RCT_EXTERN BOOL ABI49_0_0RCTBorderColorsAreEqual(ABI49_0_0RCTBorderColors borderColors);

/**
 * Convert ABI49_0_0RCTCornerRadii to ABI49_0_0RCTCornerInsets by applying border insets.
 * Effectively, returns radius - inset, with a lower bound of 0.0.
 */
ABI49_0_0RCT_EXTERN ABI49_0_0RCTCornerInsets ABI49_0_0RCTGetCornerInsets(ABI49_0_0RCTCornerRadii cornerRadii, UIEdgeInsets borderInsets);

/**
 * Create a CGPath representing a rounded rectangle with the specified bounds
 * and corner insets. Note that the CGPathRef must be released by the caller.
 */
ABI49_0_0RCT_EXTERN CGPathRef
ABI49_0_0RCTPathCreateWithRoundedRect(CGRect bounds, ABI49_0_0RCTCornerInsets cornerInsets, const CGAffineTransform *transform);

/**
 * Draw a CSS-compliant border as an image. You can determine if it's scalable
 * by inspecting the image's `capInsets`.
 *
 * `borderInsets` defines the border widths for each edge.
 */
ABI49_0_0RCT_EXTERN UIImage *ABI49_0_0RCTGetBorderImage(
    ABI49_0_0RCTBorderStyle borderStyle,
    CGSize viewSize,
    ABI49_0_0RCTCornerRadii cornerRadii,
    UIEdgeInsets borderInsets,
    ABI49_0_0RCTBorderColors borderColors,
    CGColorRef backgroundColor,
    BOOL drawToEdge);
