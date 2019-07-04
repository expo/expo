/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTConvert+Text.h"

@implementation ABI31_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI31_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI31_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI31_0_0RCT_ENUM_CONVERTER(ABI31_0_0RCTTextTransform, (@{
  @"none": @(ABI31_0_0RCTTextTransformNone),
  @"capitalize": @(ABI31_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI31_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI31_0_0RCTTextTransformLowercase),
}), ABI31_0_0RCTTextTransformUndefined, integerValue)

@end
