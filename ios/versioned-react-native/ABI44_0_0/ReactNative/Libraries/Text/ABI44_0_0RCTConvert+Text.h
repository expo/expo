/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTConvert.h>

#import "ABI44_0_0RCTTextTransform.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(nullable id)json;
+ (UITextSpellCheckingType)UITextSpellCheckingType:(nullable id)json;
+ (ABI44_0_0RCTTextTransform)ABI44_0_0RCTTextTransform:(nullable id)json;

@end

NS_ASSUME_NONNULL_END
