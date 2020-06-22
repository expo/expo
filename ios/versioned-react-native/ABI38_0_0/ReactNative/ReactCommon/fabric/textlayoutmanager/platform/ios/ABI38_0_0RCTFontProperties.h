/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI38_0_0RCTFontStyle) {
  ABI38_0_0RCTFontStyleUndefined = -1,
  ABI38_0_0RCTFontStyleNormal,
  ABI38_0_0RCTFontStyleItalic,
  ABI38_0_0RCTFontStyleOblique,
};

typedef NS_OPTIONS(NSInteger, ABI38_0_0RCTFontVariant) {
  ABI38_0_0RCTFontVariantUndefined = -1,
  ABI38_0_0RCTFontVariantDefault = 0,
  ABI38_0_0RCTFontVariantSmallCaps = 1 << 1,
  ABI38_0_0RCTFontVariantOldstyleNums = 1 << 2,
  ABI38_0_0RCTFontVariantLiningNums = 1 << 3,
  ABI38_0_0RCTFontVariantTabularNums = 1 << 4,
  ABI38_0_0RCTFontVariantProportionalNums = 1 << 5,
};

struct ABI38_0_0RCTFontProperties {
  NSString *family = nil;
  CGFloat size = NAN;
  UIFontWeight weight = NAN;
  ABI38_0_0RCTFontStyle style = ABI38_0_0RCTFontStyleUndefined;
  ABI38_0_0RCTFontVariant variant = ABI38_0_0RCTFontVariantUndefined;
  CGFloat sizeMultiplier = NAN;
};

NS_ASSUME_NONNULL_END
