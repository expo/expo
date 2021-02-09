/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0ARTNodeManager.h>

#import <ABI38_0_0React/ABI38_0_0ARTNode.h>

@implementation ABI38_0_0ARTNodeManager

ABI38_0_0RCT_EXPORT_MODULE()

- (ABI38_0_0ARTNode *)node
{
  return [ABI38_0_0ARTNode new];
}

- (UIView *)view
{
  return [self node];
}

- (ABI38_0_0RCTShadowView *)shadowView
{
  return nil;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(transform, CGAffineTransform)

@end
