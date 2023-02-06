/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTProgressViewManager.h"

#import "ABI48_0_0RCTConvert.h"

@implementation ABI48_0_0RCTConvert (ABI48_0_0RCTProgressViewManager)

ABI48_0_0RCT_ENUM_CONVERTER(
    UIProgressViewStyle,
    (@{
      @"default" : @(UIProgressViewStyleDefault),
      @"bar" : @(UIProgressViewStyleBar),
    }),
    UIProgressViewStyleDefault,
    integerValue)

@end

@implementation ABI48_0_0RCTProgressViewManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0RCTNewArchitectureValidationPlaceholder(
      ABI48_0_0RCTNotAllowedInFabricWithoutLegacy,
      self,
      @"This native component is still using the legacy interop layer -- please migrate it to use a Fabric specific implementation.");
  return [UIProgressView new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

@end
