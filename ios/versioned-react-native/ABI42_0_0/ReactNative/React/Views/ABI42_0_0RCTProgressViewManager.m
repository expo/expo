/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTProgressViewManager.h"

#import "ABI42_0_0RCTConvert.h"

@implementation ABI42_0_0RCTConvert (ABI42_0_0RCTProgressViewManager)

ABI42_0_0RCT_ENUM_CONVERTER(
    UIProgressViewStyle,
    (@{
      @"default" : @(UIProgressViewStyleDefault),
#if !TARGET_OS_TV
      @"bar" : @(UIProgressViewStyleBar),
#endif
    }),
    UIProgressViewStyleDefault,
    integerValue)

@end

@implementation ABI42_0_0RCTProgressViewManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [UIProgressView new];
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
