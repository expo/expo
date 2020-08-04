/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTBorderStyle.h>
#import <ABI37_0_0React/ABI37_0_0RCTDefines.h>

typedef struct {
  CGFloat topLeft;
  CGFloat topRight;
  CGFloat bottomLeft;
  CGFloat bottomRight;
} ABI37_0_0RCTCornerRadii;

typedef struct {
  CGSize topLeft;
  CGSize topRight;
  CGSize bottomLeft;
  CGSize bottomRight;
} ABI37_0_0RCTCornerInsets;

typedef struct {
  CGColorRef top;
  CGColorRef left;
  CGColorRef bottom;
  CGColorRef right;
} ABI37_0_0RCTBorderColors;

/**
 * Determine if the border widths, colors and radii are all equal.
 */
ABI37_0_0RCT_EXTERN BOOL ABI37_0_0RCTBorderInsetsAreEqual(UIEdgeInsets borderInsets);
ABI37_0_0RCT_EXTERN BOOL ABI37_0_0RCTCornerRadiiAreEqual(ABI37_0_0RCTCornerRadii cornerRadii);
ABI37_0_0RCT_EXTERN BOOL ABI37_0_0RCTBorderColorsAreEqual(ABI37_0_0RCTBorderColors borderColors);

/**
 * Convert ABI37_0_0RCTCornerRadii to ABI37_0_0RCTCornerInsets by applying border insets.
 * Effectively, returns radius - inset, with a lower bound of 0.0.
 */
ABI37_0_0RCT_EXTERN ABI37_0_0RCTCornerInsets ABI37_0_0RCTGetCornerInsets(ABI37_0_0RCTCornerRadii cornerRadii,
                                              UIEdgeInsets borderInsets);

/**
 * Create a CGPath representing a rounded rectangle with the specified bounds
 * and corner insets. Note that the CGPathRef must be released by the caller.
 */
ABI37_0_0RCT_EXTERN CGPathRef ABI37_0_0RCTPathCreateWithRoundedRect(CGRect bounds,
                                                  ABI37_0_0RCTCornerInsets cornerInsets,
                                                  const CGAffineTransform *transform);

/**
 * Draw a CSS-compliant border as an image. You can determine if it's scalable
 * by inspecting the image's `capInsets`.
 *
 * `borderInsets` defines the border widths for each edge.
 */
ABI37_0_0RCT_EXTERN UIImage *ABI37_0_0RCTGetBorderImage(ABI37_0_0RCTBorderStyle borderStyle,
                                      CGSize viewSize,
                                      ABI37_0_0RCTCornerRadii cornerRadii,
                                      UIEdgeInsets borderInsets,
                                      ABI37_0_0RCTBorderColors borderColors,
                                      CGColorRef backgroundColor,
                                      BOOL drawToEdge);
