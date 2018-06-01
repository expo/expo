/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0ARTNodeManager.h"

#import "ABI28_0_0ARTNode.h"

@implementation ABI28_0_0ARTNodeManager

ABI28_0_0RCT_EXPORT_MODULE()

- (ABI28_0_0ARTNode *)node
{
  return [ABI28_0_0ARTNode new];
}

- (UIView *)view
{
  return [self node];
}

- (ABI28_0_0RCTShadowView *)shadowView
{
  return nil;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(transform, CGAffineTransform)

@end
