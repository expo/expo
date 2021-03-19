/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI41_0_0React/ABI41_0_0ARTSurfaceView.h>

#import <ABI41_0_0React/ABI41_0_0RCTLog.h>

#import <ABI41_0_0React/ABI41_0_0ARTNode.h>

@implementation ABI41_0_0ARTSurfaceView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.opaque = NO;
  }

  return self;
}

- (void)insertABI41_0_0ReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI41_0_0ReactSubview:subview atIndex:atIndex];
  [self insertSubview:subview atIndex:atIndex];
  [self invalidate];
}

- (void)removeABI41_0_0ReactSubview:(UIView *)subview
{
  [super removeABI41_0_0ReactSubview:subview];
  [self invalidate];
}

- (void)didUpdateABI41_0_0ReactSubviews
{
  // Do nothing, as subviews are inserted by insertABI41_0_0ReactSubview:
}

- (void)invalidate
{
  [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect
{
  [super drawRect:rect];
  CGContextRef context = UIGraphicsGetCurrentContext();
  for (ABI41_0_0ARTNode *node in self.subviews) {
    [node renderTo:context];
  }
}

@end
