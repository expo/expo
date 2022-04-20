/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTProgressViewManager.h"

#import "ABI45_0_0RCTConvert.h"

@implementation ABI45_0_0RCTConvert (ABI45_0_0RCTProgressViewManager)

ABI45_0_0RCT_ENUM_CONVERTER(
    UIProgressViewStyle,
    (@{
      @"default" : @(UIProgressViewStyleDefault),
      @"bar" : @(UIProgressViewStyleBar),
    }),
    UIProgressViewStyleDefault,
    integerValue)

@end

@implementation ABI45_0_0RCTProgressViewManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [UIProgressView new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
