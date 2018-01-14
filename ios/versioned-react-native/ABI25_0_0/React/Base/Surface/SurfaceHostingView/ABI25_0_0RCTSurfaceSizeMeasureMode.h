/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

/**
 * Bitmask defines how size constrains from `-[UIView sizeThatFits:]`
 * are translated to `-[ABI25_0_0RCTSurface sizeThatFitsMinimumSize:maximumSize:]`.
 */
typedef NS_OPTIONS(NSInteger, ABI25_0_0RCTSurfaceSizeMeasureMode) {
  ABI25_0_0RCTSurfaceSizeMeasureModeWidthUndefined    = 0 << 0,
  ABI25_0_0RCTSurfaceSizeMeasureModeWidthExact        = 1 << 0,
  ABI25_0_0RCTSurfaceSizeMeasureModeWidthAtMost       = 2 << 0,
  ABI25_0_0RCTSurfaceSizeMeasureModeHeightUndefined   = 0 << 2,
  ABI25_0_0RCTSurfaceSizeMeasureModeHeightExact       = 1 << 2,
  ABI25_0_0RCTSurfaceSizeMeasureModeHeightAtMost      = 2 << 2,
};
