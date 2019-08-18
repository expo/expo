/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTConvert+Text.h"

@implementation ABI32_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI32_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI32_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI32_0_0RCT_ENUM_CONVERTER(ABI32_0_0RCTTextTransform, (@{
  @"none": @(ABI32_0_0RCTTextTransformNone),
  @"capitalize": @(ABI32_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI32_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI32_0_0RCTTextTransformLowercase),
}), ABI32_0_0RCTTextTransformUndefined, integerValue)

@end
