/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTProgressViewManager.h"

#import "ABI43_0_0RCTConvert.h"

@implementation ABI43_0_0RCTConvert (ABI43_0_0RCTProgressViewManager)

ABI43_0_0RCT_ENUM_CONVERTER(
    UIProgressViewStyle,
    (@{
      @"default" : @(UIProgressViewStyleDefault),
      @"bar" : @(UIProgressViewStyleBar),
    }),
    UIProgressViewStyleDefault,
    integerValue)

@end

@implementation ABI43_0_0RCTProgressViewManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [UIProgressView new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
