/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTMaskedView.h"

#import <ReactABI25_0_0/UIView+ReactABI25_0_0.h>

@implementation ABI25_0_0RCTMaskedView

- (void)didUpdateReactABI25_0_0Subviews
{
  // ABI25_0_0RCTMaskedView expects that the first subview rendered is the mask.
  UIView *maskView = [self.ReactABI25_0_0Subviews firstObject];
  self.maskView = maskView;

  // Add the other subviews to the view hierarchy
  for (NSUInteger i = 1; i < self.ReactABI25_0_0Subviews.count; i++) {
    UIView *subview = [self.ReactABI25_0_0Subviews objectAtIndex:i];
    [self addSubview:subview];
  }
}

- (void)displayLayer:(CALayer *)layer
{
  // ABI25_0_0RCTView uses displayLayer to do border rendering.
  // We don't need to do that in ABI25_0_0RCTMaskedView, so we
  // stub this method and override the default implementation.
}

@end
