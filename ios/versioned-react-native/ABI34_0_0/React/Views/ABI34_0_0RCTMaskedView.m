/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTMaskedView.h"

#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>

@implementation ABI34_0_0RCTMaskedView

- (void)didUpdateReactABI34_0_0Subviews
{
  // ABI34_0_0RCTMaskedView expects that the first subview rendered is the mask.
  UIView *maskView = [self.ReactABI34_0_0Subviews firstObject];
  self.maskView = maskView;

  // Add the other subviews to the view hierarchy
  for (NSUInteger i = 1; i < self.ReactABI34_0_0Subviews.count; i++) {
    UIView *subview = [self.ReactABI34_0_0Subviews objectAtIndex:i];
    [self addSubview:subview];
  }
}

- (void)displayLayer:(CALayer *)layer
{
  // ABI34_0_0RCTView uses displayLayer to do border rendering.
  // We don't need to do that in ABI34_0_0RCTMaskedView, so we
  // stub this method and override the default implementation.
}

@end
