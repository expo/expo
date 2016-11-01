/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "ABI11_0_0RCTBorderStyle.h"

typedef struct {
  CGFloat topLeft;
  CGFloat topRight;
  CGFloat bottomLeft;
  CGFloat bottomRight;
} ABI11_0_0RCTCornerRadii;

typedef struct {
  CGSize topLeft;
  CGSize topRight;
  CGSize bottomLeft;
  CGSize bottomRight;
} ABI11_0_0RCTCornerInsets;

typedef struct {
  CGColorRef top;
  CGColorRef left;
  CGColorRef bottom;
  CGColorRef right;
} ABI11_0_0RCTBorderColors;

/**
 * Determine if the border widths, colors and radii are all equal.
 */
BOOL ABI11_0_0RCTBorderInsetsAreEqual(UIEdgeInsets borderInsets);
BOOL ABI11_0_0RCTCornerRadiiAreEqual(ABI11_0_0RCTCornerRadii cornerRadii);
BOOL ABI11_0_0RCTBorderColorsAreEqual(ABI11_0_0RCTBorderColors borderColors);

/**
 * Convert ABI11_0_0RCTCornerRadii to ABI11_0_0RCTCornerInsets by applying border insets.
 * Effectively, returns radius - inset, with a lower bound of 0.0.
 */
ABI11_0_0RCTCornerInsets ABI11_0_0RCTGetCornerInsets(ABI11_0_0RCTCornerRadii cornerRadii,
                                   UIEdgeInsets borderInsets);

/**
 * Create a CGPath representing a rounded rectangle with the specified bounds
 * and corner insets. Note that the CGPathRef must be released by the caller.
 */
CGPathRef ABI11_0_0RCTPathCreateWithRoundedRect(CGRect bounds,
                                       ABI11_0_0RCTCornerInsets cornerInsets,
                                       const CGAffineTransform *transform);

/**
 * Draw a ABI11_0_0CSS-compliant border as an image. You can determine if it's scalable
 * by inspecting the image's `capInsets`.
 *
 * `borderInsets` defines the border widths for each edge.
 */
UIImage *ABI11_0_0RCTGetBorderImage(ABI11_0_0RCTBorderStyle borderStyle,
                           CGSize viewSize,
                           ABI11_0_0RCTCornerRadii cornerRadii,
                           UIEdgeInsets borderInsets,
                           ABI11_0_0RCTBorderColors borderColors,
                           CGColorRef backgroundColor,
                           BOOL drawToEdge);
