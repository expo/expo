/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTProgressViewManager.h"

#import "ABI30_0_0RCTConvert.h"

@implementation ABI30_0_0RCTConvert (ABI30_0_0RCTProgressViewManager)

ABI30_0_0RCT_ENUM_CONVERTER(UIProgressViewStyle, (@{
  @"default": @(UIProgressViewStyleDefault),
#if !TARGET_OS_TV
  @"bar": @(UIProgressViewStyleBar),
#endif
}), UIProgressViewStyleDefault, integerValue)

@end

@implementation ABI30_0_0RCTProgressViewManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [UIProgressView new];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
