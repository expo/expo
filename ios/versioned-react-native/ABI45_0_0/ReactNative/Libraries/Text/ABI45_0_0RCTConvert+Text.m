/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI45_0_0React/ABI45_0_0RCTConvert+Text.h>

@implementation ABI45_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI45_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI45_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI45_0_0RCT_ENUM_CONVERTER(ABI45_0_0RCTTextTransform, (@{
  @"none": @(ABI45_0_0RCTTextTransformNone),
  @"capitalize": @(ABI45_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI45_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI45_0_0RCTTextTransformLowercase),
}), ABI45_0_0RCTTextTransformUndefined, integerValue)

@end
