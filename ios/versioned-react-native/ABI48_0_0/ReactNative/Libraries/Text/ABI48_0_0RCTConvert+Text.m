/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTConvert+Text.h>

@implementation ABI48_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return json == nil           ? UITextAutocorrectionTypeDefault
      : [ABI48_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes
                               : UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return json == nil           ? UITextSpellCheckingTypeDefault
      : [ABI48_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes
                               : UITextSpellCheckingTypeNo;
}

ABI48_0_0RCT_ENUM_CONVERTER(
    ABI48_0_0RCTTextTransform,
    (@{
      @"none" : @(ABI48_0_0RCTTextTransformNone),
      @"capitalize" : @(ABI48_0_0RCTTextTransformCapitalize),
      @"uppercase" : @(ABI48_0_0RCTTextTransformUppercase),
      @"lowercase" : @(ABI48_0_0RCTTextTransformLowercase),
    }),
    ABI48_0_0RCTTextTransformUndefined,
    integerValue)

@end
