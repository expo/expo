/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTConvert+Text.h>

@implementation ABI38_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI38_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI38_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI38_0_0RCT_ENUM_CONVERTER(ABI38_0_0RCTTextTransform, (@{
  @"none": @(ABI38_0_0RCTTextTransformNone),
  @"capitalize": @(ABI38_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI38_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI38_0_0RCTTextTransformLowercase),
}), ABI38_0_0RCTTextTransformUndefined, integerValue)

@end
