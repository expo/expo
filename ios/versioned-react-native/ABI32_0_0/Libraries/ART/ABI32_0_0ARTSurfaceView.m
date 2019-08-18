/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0ARTSurfaceView.h"

#import <ReactABI32_0_0/ABI32_0_0RCTLog.h>

#import "ABI32_0_0ARTNode.h"

@implementation ABI32_0_0ARTSurfaceView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    self.opaque = NO;
  }

  return self;
}

- (void)insertReactABI32_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
  [super insertReactABI32_0_0Subview:subview atIndex:atIndex];
  [self insertSubview:subview atIndex:atIndex];
  [self invalidate];
}

- (void)removeReactABI32_0_0Subview:(UIView *)subview
{
  [super removeReactABI32_0_0Subview:subview];
  [self invalidate];
}

- (void)didUpdateReactABI32_0_0Subviews
{
  // Do nothing, as subviews are inserted by insertReactABI32_0_0Subview:
}

- (void)invalidate
{
  [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect
{
  CGContextRef context = UIGraphicsGetCurrentContext();
  for (ABI32_0_0ARTNode *node in self.subviews) {
    [node renderTo:context];
  }
}

@end
