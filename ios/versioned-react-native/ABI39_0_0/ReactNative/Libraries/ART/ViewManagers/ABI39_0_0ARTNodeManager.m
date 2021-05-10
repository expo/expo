/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI39_0_0React/ABI39_0_0ARTNodeManager.h>

#import <ABI39_0_0React/ABI39_0_0ARTNode.h>

@implementation ABI39_0_0ARTNodeManager

ABI39_0_0RCT_EXPORT_MODULE()

- (ABI39_0_0ARTNode *)node
{
  return [ABI39_0_0ARTNode new];
}

- (UIView *)view
{
  return [self node];
}

- (ABI39_0_0RCTShadowView *)shadowView
{
  return nil;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(transform, CGAffineTransform)

@end
