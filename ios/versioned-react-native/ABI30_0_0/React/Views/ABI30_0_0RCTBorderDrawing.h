/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTBorderStyle.h>

typedef struct {
  CGFloat topLeft;
  CGFloat topRight;
  CGFloat bottomLeft;
  CGFloat bottomRight;
} ABI30_0_0RCTCornerRadii;

typedef struct {
  CGSize topLeft;
  CGSize topRight;
  CGSize bottomLeft;
  CGSize bottomRight;
} ABI30_0_0RCTCornerInsets;

typedef struct {
  CGColorRef top;
  CGColorRef left;
  CGColorRef bottom;
  CGColorRef right;
} ABI30_0_0RCTBorderColors;

/**
 * Determine if the border widths, colors and radii are all equal.
 */
BOOL ABI30_0_0RCTBorderInsetsAreEqual(UIEdgeInsets borderInsets);
BOOL ABI30_0_0RCTCornerRadiiAreEqual(ABI30_0_0RCTCornerRadii cornerRadii);
BOOL ABI30_0_0RCTBorderColorsAreEqual(ABI30_0_0RCTBorderColors borderColors);

/**
 * Convert ABI30_0_0RCTCornerRadii to ABI30_0_0RCTCornerInsets by applying border insets.
 * Effectively, returns radius - inset, with a lower bound of 0.0.
 */
ABI30_0_0RCTCornerInsets ABI30_0_0RCTGetCornerInsets(ABI30_0_0RCTCornerRadii cornerRadii,
                                   UIEdgeInsets borderInsets);

/**
 * Create a CGPath representing a rounded rectangle with the specified bounds
 * and corner insets. Note that the CGPathRef must be released by the caller.
 */
CGPathRef ABI30_0_0RCTPathCreateWithRoundedRect(CGRect bounds,
                                       ABI30_0_0RCTCornerInsets cornerInsets,
                                       const CGAffineTransform *transform);

/**
 * Draw a CSS-compliant border as an image. You can determine if it's scalable
 * by inspecting the image's `capInsets`.
 *
 * `borderInsets` defines the border widths for each edge.
 */
UIImage *ABI30_0_0RCTGetBorderImage(ABI30_0_0RCTBorderStyle borderStyle,
                           CGSize viewSize,
                           ABI30_0_0RCTCornerRadii cornerRadii,
                           UIEdgeInsets borderInsets,
                           ABI30_0_0RCTBorderColors borderColors,
                           CGColorRef backgroundColor,
                           BOOL drawToEdge);
