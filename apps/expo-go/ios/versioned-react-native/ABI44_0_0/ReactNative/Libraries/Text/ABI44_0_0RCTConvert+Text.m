/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTConvert+Text.h>

@implementation ABI44_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI44_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI44_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI44_0_0RCT_ENUM_CONVERTER(ABI44_0_0RCTTextTransform, (@{
  @"none": @(ABI44_0_0RCTTextTransformNone),
  @"capitalize": @(ABI44_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI44_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI44_0_0RCTTextTransformLowercase),
}), ABI44_0_0RCTTextTransformUndefined, integerValue)

@end
