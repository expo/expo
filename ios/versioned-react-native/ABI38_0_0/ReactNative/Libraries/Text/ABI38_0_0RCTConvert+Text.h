/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>

#import "ABI38_0_0RCTTextTransform.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI38_0_0RCTConvert (Text)

+ (UITextAutocorrectionType)UITextAutocorrectionType:(nullable id)json;
+ (UITextSpellCheckingType)UITextSpellCheckingType:(nullable id)json;
+ (ABI38_0_0RCTTextTransform)ABI38_0_0RCTTextTransform:(nullable id)json;

@end

NS_ASSUME_NONNULL_END
