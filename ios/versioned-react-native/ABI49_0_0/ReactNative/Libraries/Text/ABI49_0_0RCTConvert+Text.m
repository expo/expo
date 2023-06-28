/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTConvert+Text.h>

@implementation ABI49_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return json == nil           ? UITextAutocorrectionTypeDefault
      : [ABI49_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes
                               : UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return json == nil           ? UITextSpellCheckingTypeDefault
      : [ABI49_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes
                               : UITextSpellCheckingTypeNo;
}

ABI49_0_0RCT_ENUM_CONVERTER(
    ABI49_0_0RCTTextTransform,
    (@{
      @"none" : @(ABI49_0_0RCTTextTransformNone),
      @"capitalize" : @(ABI49_0_0RCTTextTransformCapitalize),
      @"uppercase" : @(ABI49_0_0RCTTextTransformUppercase),
      @"lowercase" : @(ABI49_0_0RCTTextTransformLowercase),
    }),
    ABI49_0_0RCTTextTransformUndefined,
    integerValue)

@end
