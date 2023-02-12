/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTActivityIndicatorViewManager.h"

#import "ABI48_0_0RCTActivityIndicatorView.h"
#import "ABI48_0_0RCTConvert.h"

@implementation ABI48_0_0RCTConvert (UIActivityIndicatorView)

// NOTE: It's pointless to support UIActivityIndicatorViewStyleGray
// as we can set the color to any arbitrary value that we want to

ABI48_0_0RCT_ENUM_CONVERTER(
    UIActivityIndicatorViewStyle,
    (@{
      @"large" : @(UIActivityIndicatorViewStyleWhiteLarge),
      @"small" : @(UIActivityIndicatorViewStyleWhite),
    }),
    UIActivityIndicatorViewStyleWhiteLarge,
    integerValue)

@end

@implementation ABI48_0_0RCTActivityIndicatorViewManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI48_0_0RCTActivityIndicatorView new];
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(hidesWhenStopped, BOOL)
ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(size, UIActivityIndicatorViewStyle, UIActivityIndicatorView)
{
  /*
    Setting activityIndicatorViewStyle overrides the color, so restore the original color
    after setting the indicator style.
  */
  UIColor *oldColor = view.color;
  view.activityIndicatorViewStyle =
      json ? [ABI48_0_0RCTConvert UIActivityIndicatorViewStyle:json] : defaultView.activityIndicatorViewStyle;
  view.color = oldColor;
}

ABI48_0_0RCT_CUSTOM_VIEW_PROPERTY(animating, BOOL, UIActivityIndicatorView)
{
  BOOL animating = json ? [ABI48_0_0RCTConvert BOOL:json] : [defaultView isAnimating];
  if (animating != [view isAnimating]) {
    if (animating) {
      [view startAnimating];
    } else {
      [view stopAnimating];
    }
  }
}

@end
