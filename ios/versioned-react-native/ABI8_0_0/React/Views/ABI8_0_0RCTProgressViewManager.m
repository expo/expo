/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTProgressViewManager.h"

#import "ABI8_0_0RCTConvert.h"

@implementation ABI8_0_0RCTConvert (ABI8_0_0RCTProgressViewManager)

ABI8_0_0RCT_ENUM_CONVERTER(UIProgressViewStyle, (@{
  @"default": @(UIProgressViewStyleDefault),
  @"bar": @(UIProgressViewStyleBar),
}), UIProgressViewStyleDefault, integerValue)

@end

@implementation ABI8_0_0RCTProgressViewManager

ABI8_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [UIProgressView new];
}

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
