/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTConvert+Text.h>

@implementation ABI43_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI43_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI43_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI43_0_0RCT_ENUM_CONVERTER(ABI43_0_0RCTTextTransform, (@{
  @"none": @(ABI43_0_0RCTTextTransformNone),
  @"capitalize": @(ABI43_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI43_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI43_0_0RCTTextTransformLowercase),
}), ABI43_0_0RCTTextTransformUndefined, integerValue)

@end
