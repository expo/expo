/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI48_0_0RCTDynamicTypeRamp) {
  ABI48_0_0RCTDynamicTypeRampUndefined,
  ABI48_0_0RCTDynamicTypeRampCaption2,
  ABI48_0_0RCTDynamicTypeRampCaption1,
  ABI48_0_0RCTDynamicTypeRampFootnote,
  ABI48_0_0RCTDynamicTypeRampSubheadline,
  ABI48_0_0RCTDynamicTypeRampCallout,
  ABI48_0_0RCTDynamicTypeRampBody,
  ABI48_0_0RCTDynamicTypeRampHeadline,
  ABI48_0_0RCTDynamicTypeRampTitle3,
  ABI48_0_0RCTDynamicTypeRampTitle2,
  ABI48_0_0RCTDynamicTypeRampTitle1,
  ABI48_0_0RCTDynamicTypeRampLargeTitle
};

@interface ABI48_0_0RCTConvert (DynamicTypeRamp)

+ (ABI48_0_0RCTDynamicTypeRamp)ABI48_0_0RCTDynamicTypeRamp:(nullable id)json;

@end

/// Generates a `UIFontMetrics` instance representing a particular Dynamic Type ramp.
UIFontMetrics *_Nonnull ABI48_0_0RCTUIFontMetricsForDynamicTypeRamp(ABI48_0_0RCTDynamicTypeRamp dynamicTypeRamp);
/// The "reference" size for a particular font scale ramp, equal to a text element's size under default text size
/// settings.
CGFloat ABI48_0_0RCTBaseSizeForDynamicTypeRamp(ABI48_0_0RCTDynamicTypeRamp dynamicTypeRamp);
