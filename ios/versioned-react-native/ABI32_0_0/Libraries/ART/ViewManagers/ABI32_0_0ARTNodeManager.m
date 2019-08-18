/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0ARTNodeManager.h"

#import "ABI32_0_0ARTNode.h"

@implementation ABI32_0_0ARTNodeManager

ABI32_0_0RCT_EXPORT_MODULE()

- (ABI32_0_0ARTNode *)node
{
  return [ABI32_0_0ARTNode new];
}

- (UIView *)view
{
  return [self node];
}

- (ABI32_0_0RCTShadowView *)shadowView
{
  return nil;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(transform, CGAffineTransform)

@end
