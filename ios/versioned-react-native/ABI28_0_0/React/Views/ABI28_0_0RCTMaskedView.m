/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTMaskedView.h"

#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>

@implementation ABI28_0_0RCTMaskedView

- (void)didUpdateReactABI28_0_0Subviews
{
  // ABI28_0_0RCTMaskedView expects that the first subview rendered is the mask.
  UIView *maskView = [self.ReactABI28_0_0Subviews firstObject];
  self.maskView = maskView;

  // Add the other subviews to the view hierarchy
  for (NSUInteger i = 1; i < self.ReactABI28_0_0Subviews.count; i++) {
    UIView *subview = [self.ReactABI28_0_0Subviews objectAtIndex:i];
    [self addSubview:subview];
  }
}

- (void)displayLayer:(CALayer *)layer
{
  // ABI28_0_0RCTView uses displayLayer to do border rendering.
  // We don't need to do that in ABI28_0_0RCTMaskedView, so we
  // stub this method and override the default implementation.
}

@end
