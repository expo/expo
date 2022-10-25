/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI47_0_0RCTFontStyle) {
  ABI47_0_0RCTFontStyleUndefined = -1,
  ABI47_0_0RCTFontStyleNormal,
  ABI47_0_0RCTFontStyleItalic,
  ABI47_0_0RCTFontStyleOblique,
};

typedef NS_OPTIONS(NSInteger, ABI47_0_0RCTFontVariant) {
  ABI47_0_0RCTFontVariantUndefined = -1,
  ABI47_0_0RCTFontVariantDefault = 0,
  ABI47_0_0RCTFontVariantSmallCaps = 1 << 1,
  ABI47_0_0RCTFontVariantOldstyleNums = 1 << 2,
  ABI47_0_0RCTFontVariantLiningNums = 1 << 3,
  ABI47_0_0RCTFontVariantTabularNums = 1 << 4,
  ABI47_0_0RCTFontVariantProportionalNums = 1 << 5,
};

struct ABI47_0_0RCTFontProperties {
  NSString *family = nil;
  CGFloat size = NAN;
  UIFontWeight weight = NAN;
  ABI47_0_0RCTFontStyle style = ABI47_0_0RCTFontStyleUndefined;
  ABI47_0_0RCTFontVariant variant = ABI47_0_0RCTFontVariantUndefined;
  CGFloat sizeMultiplier = NAN;
};

NS_ASSUME_NONNULL_END
