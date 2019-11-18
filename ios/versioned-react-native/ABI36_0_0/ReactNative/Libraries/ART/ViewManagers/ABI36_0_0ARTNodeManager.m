/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0ARTNodeManager.h>

#import <ABI36_0_0React/ABI36_0_0ARTNode.h>

@implementation ABI36_0_0ARTNodeManager

ABI36_0_0RCT_EXPORT_MODULE()

- (ABI36_0_0ARTNode *)node
{
  return [ABI36_0_0ARTNode new];
}

- (UIView *)view
{
  return [self node];
}

- (ABI36_0_0RCTShadowView *)shadowView
{
  return nil;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(transform, CGAffineTransform)

@end
