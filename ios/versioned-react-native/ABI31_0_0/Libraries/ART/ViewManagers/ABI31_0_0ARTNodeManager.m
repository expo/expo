/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0ARTNodeManager.h"

#import "ABI31_0_0ARTNode.h"

@implementation ABI31_0_0ARTNodeManager

ABI31_0_0RCT_EXPORT_MODULE()

- (ABI31_0_0ARTNode *)node
{
  return [ABI31_0_0ARTNode new];
}

- (UIView *)view
{
  return [self node];
}

- (ABI31_0_0RCTShadowView *)shadowView
{
  return nil;
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(transform, CGAffineTransform)

@end
