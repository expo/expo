/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0ARTNodeManager.h"

#import "ABI34_0_0ARTNode.h"

@implementation ABI34_0_0ARTNodeManager

ABI34_0_0RCT_EXPORT_MODULE()

- (ABI34_0_0ARTNode *)node
{
  return [ABI34_0_0ARTNode new];
}

- (UIView *)view
{
  return [self node];
}

- (ABI34_0_0RCTShadowView *)shadowView
{
  return nil;
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(transform, CGAffineTransform)

@end
