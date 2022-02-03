/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTConvert+Text.h>

@implementation ABI42_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI42_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI42_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI42_0_0RCT_ENUM_CONVERTER(ABI42_0_0RCTTextTransform, (@{
  @"none": @(ABI42_0_0RCTTextTransformNone),
  @"capitalize": @(ABI42_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI42_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI42_0_0RCTTextTransformLowercase),
}), ABI42_0_0RCTTextTransformUndefined, integerValue)

@end
