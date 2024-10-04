/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTMaskedView.h"

#import <ABI46_0_0React/ABI46_0_0UIView+React.h>

@implementation ABI46_0_0RCTMaskedView

- (void)didUpdateABI46_0_0ReactSubviews
{
  // ABI46_0_0RCTMaskedView expects that the first subview rendered is the mask.
  UIView *maskView = [self.ABI46_0_0ReactSubviews firstObject];
  self.maskView = maskView;

  // Add the other subviews to the view hierarchy
  for (NSUInteger i = 1; i < self.ABI46_0_0ReactSubviews.count; i++) {
    UIView *subview = [self.ABI46_0_0ReactSubviews objectAtIndex:i];
    [self addSubview:subview];
  }
}

- (void)displayLayer:(__unused CALayer *)layer
{
  // ABI46_0_0RCTView uses displayLayer to do border rendering.
  // We don't need to do that in ABI46_0_0RCTMaskedView, so we
  // stub this method and override the default implementation.
}

@end
