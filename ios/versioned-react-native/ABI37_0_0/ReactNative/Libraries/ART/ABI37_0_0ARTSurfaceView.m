/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0ARTSurfaceView.h>

#import <ABI37_0_0React/ABI37_0_0RCTLog.h>

#import <ABI37_0_0React/ABI37_0_0ARTNode.h>

@implementation ABI37_0_0ARTSurfaceView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.opaque = NO;
  }

  return self;
}

- (void)insertABI37_0_0ReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI37_0_0ReactSubview:subview atIndex:atIndex];
  [self insertSubview:subview atIndex:atIndex];
  [self invalidate];
}

- (void)removeABI37_0_0ReactSubview:(UIView *)subview
{
  [super removeABI37_0_0ReactSubview:subview];
  [self invalidate];
}

- (void)didUpdateABI37_0_0ReactSubviews
{
  // Do nothing, as subviews are inserted by insertABI37_0_0ReactSubview:
}

- (void)invalidate
{
  [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect
{
  CGContextRef context = UIGraphicsGetCurrentContext();
  for (ABI37_0_0ARTNode *node in self.subviews) {
    [node renderTo:context];
  }
}

@end
