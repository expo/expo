/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0ARTSurfaceView.h"

#import <ReactABI25_0_0/ABI25_0_0RCTLog.h>

#import "ABI25_0_0ARTNode.h"

@implementation ABI25_0_0ARTSurfaceView

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

- (void)invalidate
{
  [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect
{
  CGContextRef context = UIGraphicsGetCurrentContext();
  for (ABI25_0_0ARTNode *node in self.subviews) {
    [node renderTo:context];
  }
}

- (void)ReactABI25_0_0SetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor
{
  self.backgroundColor = inheritedBackgroundColor;
}

@end
