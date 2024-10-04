/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

#ifdef __cplusplus
extern "C" {
#endif

// Get window and screen dimensions
typedef struct {
  struct {
    CGFloat width, height, scale, fontScale;
  } window, screen;
} ABI47_0_0RCTDimensions;
extern __attribute__((visibility("default"))) ABI47_0_0RCTDimensions ABI47_0_0RCTGetDimensions(CGFloat fontScale);

// Get font size multiplier for font base size (Large) by content size category
extern __attribute__((visibility("default"))) CGFloat ABI47_0_0RCTGetMultiplierForContentSizeCategory(
    UIContentSizeCategory category);

#ifdef __cplusplus
}
#endif

NS_ASSUME_NONNULL_END
