/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0RCTConvert+Text.h>

@implementation ABI36_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(id)json
{
  return
    json == nil ? UITextAutocorrectionTypeDefault :
    [ABI36_0_0RCTConvert BOOL:json] ? UITextAutocorrectionTypeYes :
    UITextAutocorrectionTypeNo;
}

+ (UITextSpellCheckingType)UITextSpellCheckingType:(id)json
{
  return
    json == nil ? UITextSpellCheckingTypeDefault :
    [ABI36_0_0RCTConvert BOOL:json] ? UITextSpellCheckingTypeYes :
    UITextSpellCheckingTypeNo;
}

ABI36_0_0RCT_ENUM_CONVERTER(ABI36_0_0RCTTextTransform, (@{
  @"none": @(ABI36_0_0RCTTextTransformNone),
  @"capitalize": @(ABI36_0_0RCTTextTransformCapitalize),
  @"uppercase": @(ABI36_0_0RCTTextTransformUppercase),
  @"lowercase": @(ABI36_0_0RCTTextTransformLowercase),
}), ABI36_0_0RCTTextTransformUndefined, integerValue)

@end
