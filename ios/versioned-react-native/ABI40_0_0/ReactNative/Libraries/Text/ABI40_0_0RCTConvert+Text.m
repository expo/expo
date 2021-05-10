/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTConvert+Text.h>

@implementation ABI40_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI40_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI40_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI40_0_0RCT_ENUM_CONVERTER(ABI40_0_0RCTTextTransform, (@{
  @"none": @(ABI40_0_0RCTTextTransformNone),
  @"capitalize": @(ABI40_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI40_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI40_0_0RCTTextTransformLowercase),
}), ABI40_0_0RCTTextTransformUndefined, integerValue)

@end
