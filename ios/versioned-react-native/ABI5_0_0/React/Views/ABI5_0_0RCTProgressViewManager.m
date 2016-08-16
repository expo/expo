/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTProgressViewManager.h"

#import "ABI5_0_0RCTConvert.h"

@implementation ABI5_0_0RCTConvert (ABI5_0_0RCTProgressViewManager)

ABI5_0_0RCT_ENUM_CONVERTER(UIProgressViewStyle, (@{
  @"default": @(UIProgressViewStyleDefault),
  @"bar": @(UIProgressViewStyleBar),
}), UIProgressViewStyleDefault, integerValue)

@end

@implementation ABI5_0_0RCTProgressViewManager

ABI5_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [UIProgressView new];
}

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(progressViewStyle, UIProgressViewStyle)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(progress, float)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(progressTintColor, UIColor)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(trackTintColor, UIColor)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(progressImage, UIImage)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(trackImage, UIImage)

- (NSDictionary<NSString *, id> *)constantsToExport
{
  UIProgressView *view = [UIProgressView new];
  return @{
    @"ComponentHeight": @(view.intrinsicContentSize.height),
  };
}

@end
