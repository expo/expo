/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTConvert+Text.h>

@implementation ABI37_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI37_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI37_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI37_0_0RCT_ENUM_CONVERTER(ABI37_0_0RCTTextTransform, (@{
  @"none": @(ABI37_0_0RCTTextTransformNone),
  @"capitalize": @(ABI37_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI37_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI37_0_0RCTTextTransformLowercase),
}), ABI37_0_0RCTTextTransformUndefined, integerValue)

@end
