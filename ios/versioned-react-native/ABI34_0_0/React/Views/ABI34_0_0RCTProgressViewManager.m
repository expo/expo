/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTProgressViewManager.h"

#import "ABI34_0_0RCTConvert.h"

@implementation ABI34_0_0RCTConvert (ABI34_0_0RCTProgressViewManager)

ABI34_0_0RCT_ENUM_CONVERTER(UIProgressViewStyle, (@{
  @"default": @(UIProgressViewStyleDefault),
#if !TARGET_OS_TV
  @"bar": @(UIProgressViewStyleBar),
#endif
}), UIProgressViewStyleDefault, integerValue)

@end

@implementation ABI34_0_0RCTProgressViewManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [UIProgressView new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
