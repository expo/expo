/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTProgressViewManager.h"

#import "ABI6_0_0RCTConvert.h"

@implementation ABI6_0_0RCTConvert (ABI6_0_0RCTProgressViewManager)

ABI6_0_0RCT_ENUM_CONVERTER(UIProgressViewStyle, (@{
  @"default": @(UIProgressViewStyleDefault),
  @"bar": @(UIProgressViewStyleBar),
}), UIProgressViewStyleDefault, integerValue)

@end

@implementation ABI6_0_0RCTProgressViewManager

ABI6_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [UIProgressView new];
}

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
