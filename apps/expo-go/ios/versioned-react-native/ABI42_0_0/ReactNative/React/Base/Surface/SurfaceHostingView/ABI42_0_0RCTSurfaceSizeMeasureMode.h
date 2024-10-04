/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTDefines.h>

/**
 * Bitmask defines how size constrains from `-[UIView sizeThatFits:]`
 * are translated to `-[ABI42_0_0RCTSurface sizeThatFitsMinimumSize:maximumSize:]`.
 */
typedef NS_OPTIONS(NSInteger, ABI42_0_0RCTSurfaceSizeMeasureMode) {
  ABI42_0_0RCTSurfaceSizeMeasureModeWidthUndefined = 0 << 0,
  ABI42_0_0RCTSurfaceSizeMeasureModeWidthExact = 1 << 0,
  ABI42_0_0RCTSurfaceSizeMeasureModeWidthAtMost = 2 << 0,
  ABI42_0_0RCTSurfaceSizeMeasureModeHeightUndefined = 0 << 2,
  ABI42_0_0RCTSurfaceSizeMeasureModeHeightExact = 1 << 2,
  ABI42_0_0RCTSurfaceSizeMeasureModeHeightAtMost = 2 << 2,
};

/**
 * Returns size constraints based on `size` and `sizeMeasureMode`.
 */
ABI42_0_0RCT_EXTERN void ABI42_0_0RCTSurfaceMinimumSizeAndMaximumSizeFromSizeAndSizeMeasureMode(
    CGSize size,
    ABI42_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode,
    CGSize *minimumSize,
    CGSize *maximumSize);
