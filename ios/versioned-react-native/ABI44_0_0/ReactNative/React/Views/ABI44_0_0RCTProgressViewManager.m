/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTProgressViewManager.h"

#import "ABI44_0_0RCTConvert.h"

@implementation ABI44_0_0RCTConvert (ABI44_0_0RCTProgressViewManager)

ABI44_0_0RCT_ENUM_CONVERTER(
    UIProgressViewStyle,
    (@{
      @"default" : @(UIProgressViewStyleDefault),
      @"bar" : @(UIProgressViewStyleBar),
    }),
    UIProgressViewStyleDefault,
    integerValue)

@end

@implementation ABI44_0_0RCTProgressViewManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [UIProgressView new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
