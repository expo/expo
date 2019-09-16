/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTConvert+Text.h"

@implementation ABI35_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI35_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI35_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI35_0_0RCT_ENUM_CONVERTER(ABI35_0_0RCTTextTransform, (@{
  @"none": @(ABI35_0_0RCTTextTransformNone),
  @"capitalize": @(ABI35_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI35_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI35_0_0RCTTextTransformLowercase),
}), ABI35_0_0RCTTextTransformUndefined, integerValue)

@end
