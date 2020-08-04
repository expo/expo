/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTProgressViewManager.h"

#import "ABI37_0_0RCTConvert.h"

@implementation ABI37_0_0RCTConvert (ABI37_0_0RCTProgressViewManager)

ABI37_0_0RCT_ENUM_CONVERTER(UIProgressViewStyle, (@{
  @"default": @(UIProgressViewStyleDefault),
#if !TARGET_OS_TV
  @"bar": @(UIProgressViewStyleBar),
#endif
}), UIProgressViewStyleDefault, integerValue)

@end

@implementation ABI37_0_0RCTProgressViewManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [UIProgressView new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
