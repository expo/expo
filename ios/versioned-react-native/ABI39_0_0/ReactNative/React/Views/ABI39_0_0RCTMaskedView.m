/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RCTMaskedView.h"

#import <ABI39_0_0React/ABI39_0_0UIView+React.h>

@implementation ABI39_0_0RCTMaskedView

- (void)didUpdateABI39_0_0ReactSubviews
{
  // ABI39_0_0RCTMaskedView expects that the first subview rendered is the mask.
  UIView *maskView = [self.ABI39_0_0ReactSubviews firstObject];
  self.maskView = maskView;

  // Add the other subviews to the view hierarchy
  for (NSUInteger i = 1; i < self.ABI39_0_0ReactSubviews.count; i++) {
    UIView *subview = [self.ABI39_0_0ReactSubviews objectAtIndex:i];
    [self addSubview:subview];
  }
}

- (void)displayLayer:(__unused CALayer *)layer
{
  // ABI39_0_0RCTView uses displayLayer to do border rendering.
  // We don't need to do that in ABI39_0_0RCTMaskedView, so we
  // stub this method and override the default implementation.
}

@end
