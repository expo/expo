/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "ABI49_0_0RCTSurfaceSizeMeasureMode.h"

void ABI49_0_0RCTSurfaceMinimumSizeAndMaximumSizeFromSizeAndSizeMeasureMode(
    CGSize size,
    ABI49_0_0RCTSurfaceSizeMeasureMode sizeMeasureMode,
    CGSize *minimumSize,
    CGSize *maximumSize)
{
  *minimumSize = CGSizeZero;
  *maximumSize = CGSizeMake(CGFLOAT_MAX, CGFLOAT_MAX);

  if (sizeMeasureMode & ABI49_0_0RCTSurfaceSizeMeasureModeWidthExact) {
    minimumSize->width = size.width;
    maximumSize->width = size.width;
  } else if (sizeMeasureMode & ABI49_0_0RCTSurfaceSizeMeasureModeWidthAtMost) {
    maximumSize->width = size.width;
  }

  if (sizeMeasureMode & ABI49_0_0RCTSurfaceSizeMeasureModeHeightExact) {
    minimumSize->height = size.height;
    maximumSize->height = size.height;
  } else if (sizeMeasureMode & ABI49_0_0RCTSurfaceSizeMeasureModeHeightAtMost) {
    maximumSize->height = size.height;
  }
}
