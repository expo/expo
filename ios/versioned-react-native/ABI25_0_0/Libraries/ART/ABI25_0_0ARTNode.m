/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0ARTNode.h"

#import "ABI25_0_0ARTContainer.h"

@implementation ABI25_0_0ARTNode

- (void)insertReactABI25_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI25_0_0Subview:subview atIndex:atIndex];
  [self insertSubview:subview atIndex:atIndex];
  [self invalidate];
}

- (void)removeReactABI25_0_0Subview:(UIView *)subview
{
  [super removeReactABI25_0_0Subview:subview];
  [self invalidate];
}

- (void)didUpdateReactABI25_0_0Subviews
{
  // Do nothing, as subviews are inserted by insertReactABI25_0_0Subview:
}

- (void)setOpacity:(CGFloat)opacity
{
  [self invalidate];
  _opacity = opacity;
}

- (void)setTransform:(CGAffineTransform)transform
{
  [self invalidate];
  super.transform = transform;
}

- (void)invalidate
{
  id<ABI25_0_0ARTContainer> container = (id<ABI25_0_0ARTContainer>)self.superview;
  [container invalidate];
}

- (void)renderTo:(CGContextRef)context
{
  if (self.opacity <= 0) {
    // Nothing to paint
    return;
  }
  if (self.opacity >= 1) {
    // Just paint at full opacity
    CGContextSaveGState(context);
    CGContextConcatCTM(context, self.transform);
    CGContextSetAlpha(context, 1);
    [self renderLayerTo:context];
    CGContextRestoreGState(context);
    return;
  }
  // This needs to be painted on a layer before being composited.
  CGContextSaveGState(context);
  CGContextConcatCTM(context, self.transform);
  CGContextSetAlpha(context, self.opacity);
  CGContextBeginTransparencyLayer(context, NULL);
  [self renderLayerTo:context];
  CGContextEndTransparencyLayer(context);
  CGContextRestoreGState(context);
}

- (void)renderLayerTo:(CGContextRef)context
{
  // abstract
}

@end
