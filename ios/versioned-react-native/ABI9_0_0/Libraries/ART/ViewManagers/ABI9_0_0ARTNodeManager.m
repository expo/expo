/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0ARTNodeManager.h"

#import "ABI9_0_0ARTNode.h"

@implementation ABI9_0_0ARTNodeManager

ABI9_0_0RCT_EXPORT_MODULE()

- (ABI9_0_0ARTNode *)node
{
  return [ABI9_0_0ARTNode new];
}

- (UIView *)view
{
  return [self node];
}

- (ABI9_0_0RCTShadowView *)shadowView
{
  return nil;
}

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(transform, CGAffineTransform)

@end
