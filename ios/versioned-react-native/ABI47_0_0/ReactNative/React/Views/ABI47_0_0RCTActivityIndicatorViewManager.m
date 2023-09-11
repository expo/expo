/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTActivityIndicatorViewManager.h"

#import "ABI47_0_0RCTActivityIndicatorView.h"
#import "ABI47_0_0RCTConvert.h"

@implementation ABI47_0_0RCTConvert (UIActivityIndicatorView)

// NOTE: It's pointless to support UIActivityIndicatorViewStyleGray
// as we can set the color to any arbitrary value that we want to

ABI47_0_0RCT_ENUM_CONVERTER(
    UIActivityIndicatorViewStyle,
    (@{
      @"large" : @(UIActivityIndicatorViewStyleWhiteLarge),
      @"small" : @(UIActivityIndicatorViewStyleWhite),
    }),
    UIActivityIndicatorViewStyleWhiteLarge,
    integerValue)

@end

@implementation ABI47_0_0RCTActivityIndicatorViewManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI47_0_0RCTActivityIndicatorView new];
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(color, UIColor)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(hidesWhenStopped, BOOL)
ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(size, UIActivityIndicatorViewStyle, UIActivityIndicatorView)
{
  /*
    Setting activityIndicatorViewStyle overrides the color, so restore the original color
    after setting the indicator style.
  */
  UIColor *oldColor = view.color;
  view.activityIndicatorViewStyle =
      json ? [ABI47_0_0RCTConvert UIActivityIndicatorViewStyle:json] : defaultView.activityIndicatorViewStyle;
  view.color = oldColor;
}

ABI47_0_0RCT_CUSTOM_VIEW_PROPERTY(animating, BOOL, UIActivityIndicatorView)
{
  BOOL animating = json ? [ABI47_0_0RCTConvert BOOL:json] : [defaultView isAnimating];
  if (animating != [view isAnimating]) {
    if (animating) {
      [view startAnimating];
    } else {
      [view stopAnimating];
    }
  }
}

@end
