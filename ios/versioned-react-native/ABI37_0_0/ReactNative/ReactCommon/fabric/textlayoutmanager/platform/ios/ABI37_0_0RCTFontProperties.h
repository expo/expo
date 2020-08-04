/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, ABI37_0_0RCTFontStyle) {
  ABI37_0_0RCTFontStyleUndefined = -1,
  ABI37_0_0RCTFontStyleNormal,
  ABI37_0_0RCTFontStyleItalic,
  ABI37_0_0RCTFontStyleOblique,
};

typedef NS_OPTIONS(NSInteger, ABI37_0_0RCTFontVariant) {
  ABI37_0_0RCTFontVariantUndefined = -1,
  ABI37_0_0RCTFontVariantDefault = 0,
  ABI37_0_0RCTFontVariantSmallCaps = 1 << 1,
  ABI37_0_0RCTFontVariantOldstyleNums = 1 << 2,
  ABI37_0_0RCTFontVariantLiningNums = 1 << 3,
  ABI37_0_0RCTFontVariantTabularNums = 1 << 4,
  ABI37_0_0RCTFontVariantProportionalNums = 1 << 5,
};

struct ABI37_0_0RCTFontProperties {
  NSString *family = nil;
  CGFloat size = NAN;
  UIFontWeight weight = NAN;
  ABI37_0_0RCTFontStyle style = ABI37_0_0RCTFontStyleUndefined;
  ABI37_0_0RCTFontVariant variant = ABI37_0_0RCTFontVariantUndefined;
  CGFloat sizeMultiplier = NAN;
};

NS_ASSUME_NONNULL_END
