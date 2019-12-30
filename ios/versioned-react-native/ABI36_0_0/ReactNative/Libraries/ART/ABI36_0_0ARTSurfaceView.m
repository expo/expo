/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0ARTSurfaceView.h>

#import <ABI36_0_0React/ABI36_0_0RCTLog.h>

#import <ABI36_0_0React/ABI36_0_0ARTNode.h>

@implementation ABI36_0_0ARTSurfaceView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.opaque = NO;
  }

  return self;
}

- (void)insertABI36_0_0ReactSubview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [super insertABI36_0_0ReactSubview:subview atIndex:atIndex];
  [self insertSubview:subview atIndex:atIndex];
  [self invalidate];
}

- (void)removeABI36_0_0ReactSubview:(UIView *)subview
{
  [super removeABI36_0_0ReactSubview:subview];
  [self invalidate];
}

- (void)didUpdateABI36_0_0ReactSubviews
{
  // Do nothing, as subviews are inserted by insertABI36_0_0ReactSubview:
}

- (void)invalidate
{
  [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect
{
  CGContextRef context = UIGraphicsGetCurrentContext();
  for (ABI36_0_0ARTNode *node in self.subviews) {
    [node renderTo:context];
  }
}

@end
