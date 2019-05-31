/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTConvert+Text.h"

@implementation ABI33_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI33_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI33_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI33_0_0RCT_ENUM_CONVERTER(ABI33_0_0RCTTextTransform, (@{
  @"none": @(ABI33_0_0RCTTextTransformNone),
  @"capitalize": @(ABI33_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI33_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI33_0_0RCTTextTransformLowercase),
}), ABI33_0_0RCTTextTransformUndefined, integerValue)

@end
