/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0RCTConvert+Text.h>

@implementation ABI41_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI41_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI41_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI41_0_0RCT_ENUM_CONVERTER(ABI41_0_0RCTTextTransform, (@{
  @"none": @(ABI41_0_0RCTTextTransformNone),
  @"capitalize": @(ABI41_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI41_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI41_0_0RCTTextTransformLowercase),
}), ABI41_0_0RCTTextTransformUndefined, integerValue)

@end
