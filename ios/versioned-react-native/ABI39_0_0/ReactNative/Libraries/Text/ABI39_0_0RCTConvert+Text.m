/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0RCTConvert+Text.h>

@implementation ABI39_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI39_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI39_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI39_0_0RCT_ENUM_CONVERTER(ABI39_0_0RCTTextTransform, (@{
  @"none": @(ABI39_0_0RCTTextTransformNone),
  @"capitalize": @(ABI39_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI39_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI39_0_0RCTTextTransformLowercase),
}), ABI39_0_0RCTTextTransformUndefined, integerValue)

@end
