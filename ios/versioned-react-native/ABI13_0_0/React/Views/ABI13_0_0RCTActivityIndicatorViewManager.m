/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTActivityIndicatorViewManager.h"

#import "ABI13_0_0RCTActivityIndicatorView.h"
#import "ABI13_0_0RCTConvert.h"

@implementation ABI13_0_0RCTConvert (UIActivityIndicatorView)

// NOTE: It's pointless to support UIActivityIndicatorViewStyleGray
// as we can set the color to any arbitrary value that we want to

ABI13_0_0RCT_ENUM_CONVERTER(UIActivityIndicatorViewStyle, (@{
  @"large": @(UIActivityIndicatorViewStyleWhiteLarge),
  @"small": @(UIActivityIndicatorViewStyleWhite),
}), UIActivityIndicatorViewStyleWhiteLarge, integerValue)

@end

@implementation ABI13_0_0RCTActivityIndicatorViewManager

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI13_0_0RCTActivityIndicatorView new];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(hidesWhenStopped, BOOL)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(size, activityIndicatorViewStyle, UIActivityIndicatorViewStyle)
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(animating, BOOL, UIActivityIndicatorView)
{
  BOOL animating = json ? [ABI13_0_0RCTConvert BOOL:json] : [defaultView isAnimating];
  if (animating != [view isAnimating]) {
    if (animating) {
      [view startAnimating];
    } else {
      [view stopAnimating];
    }
  }
}

@end
