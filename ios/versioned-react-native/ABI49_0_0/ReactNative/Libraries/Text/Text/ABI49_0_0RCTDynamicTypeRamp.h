/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>

typedef NS_ENUM(NSInteger, ABI49_0_0RCTDynamicTypeRamp) {
  ABI49_0_0RCTDynamicTypeRampUndefined,
  ABI49_0_0RCTDynamicTypeRampCaption2,
  ABI49_0_0RCTDynamicTypeRampCaption1,
  ABI49_0_0RCTDynamicTypeRampFootnote,
  ABI49_0_0RCTDynamicTypeRampSubheadline,
  ABI49_0_0RCTDynamicTypeRampCallout,
  ABI49_0_0RCTDynamicTypeRampBody,
  ABI49_0_0RCTDynamicTypeRampHeadline,
  ABI49_0_0RCTDynamicTypeRampTitle3,
  ABI49_0_0RCTDynamicTypeRampTitle2,
  ABI49_0_0RCTDynamicTypeRampTitle1,
  ABI49_0_0RCTDynamicTypeRampLargeTitle
};

@interface ABI49_0_0RCTConvert (DynamicTypeRamp)

+ (ABI49_0_0RCTDynamicTypeRamp)ABI49_0_0RCTDynamicTypeRamp:(nullable id)json;

@end

/// Generates a `UIFontMetrics` instance representing a particular Dynamic Type ramp.
UIFontMetrics *_Nonnull ABI49_0_0RCTUIFontMetricsForDynamicTypeRamp(ABI49_0_0RCTDynamicTypeRamp dynamicTypeRamp);
/// The "reference" size for a particular font scale ramp, equal to a text element's size under default text size
/// settings.
CGFloat ABI49_0_0RCTBaseSizeForDynamicTypeRamp(ABI49_0_0RCTDynamicTypeRamp dynamicTypeRamp);
