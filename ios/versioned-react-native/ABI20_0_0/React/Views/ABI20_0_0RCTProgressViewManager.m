/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTProgressViewManager.h"

#import "ABI20_0_0RCTConvert.h"

@implementation ABI20_0_0RCTConvert (ABI20_0_0RCTProgressViewManager)

ABI20_0_0RCT_ENUM_CONVERTER(UIProgressViewStyle, (@{
  @"default": @(UIProgressViewStyleDefault),
#if !TARGET_OS_TV
  @"bar": @(UIProgressViewStyleBar),
#endif
}), UIProgressViewStyleDefault, integerValue)

@end

@implementation ABI20_0_0RCTProgressViewManager

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [UIProgressView new];
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
